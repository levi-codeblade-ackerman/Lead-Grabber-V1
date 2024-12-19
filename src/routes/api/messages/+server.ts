import { pb } from '$lib/pocketbase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TWILIO_ENABLED } from '$env/static/private';

function getAutoReplyMessage(
  source: string,
  autoReplySettings: any,
  currentHour: number
): string | null {
  if (!autoReplySettings?.textAutoReply) return null;

  const isInBusinessHours = isBusinessHours(currentHour, autoReplySettings.businessHours);
  
  if (source === 'leadform') {
    return isInBusinessHours 
      ? autoReplySettings.leadformBusinessHoursMessage 
      : autoReplySettings.leadformAfterHoursMessage;
  }
  
  return isInBusinessHours 
    ? autoReplySettings.businessHoursMessage 
    : autoReplySettings.afterHoursMessage;
}

export const POST: RequestHandler = async ({ request }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const messageData = await request.json();
    
    if (!messageData.company_id) {
      return json(
        { success: false, error: 'Company ID is required' },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Verify company exists
    try {
      await pb.collection('companies').getOne(messageData.company_id);
    } catch (err) {
      // If company doesn't exist and we have a valid user ID, try to create a default company
      if (messageData.company_id && messageData.company_id.length > 0) {
        try {
          const user = await pb.collection('users').getOne(messageData.company_id);
          const companyData = {
            name: `${user.name}'s Company`,
            owner: user.id,
            team_members: [user.id],
            settings: JSON.stringify({
              branding: {
                primary_color: '#3B5BDB',
                logo_url: ''
              },
              notifications: {
                email: true,
                web: true
              }
            })
          };
          
          const company = await pb.collection('companies').create(companyData);
          messageData.company_id = company.id;
        } catch (userErr) {
          return json(
            { success: false, error: 'Invalid company or user ID' },
            {
              status: 400,
              headers: corsHeaders
            }
          );
        }
      } else {
        return json(
          { success: false, error: 'Invalid company ID' },
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }
    }
    
    // Create the message in PocketBase
    const record = await pb.collection('messages').create(messageData);
    
    // Send auto-reply via Twilio if enabled and phone number exists
    if (TWILIO_ENABLED === 'true' && messageData.customer_phone) {
      try {
        const company = await pb.collection('companies').getOne(messageData.company_id);
        const autoReplySettings = company.settings?.autoReply;
        
        const message = getAutoReplyMessage(
          messageData.source,
          autoReplySettings,
          new Date().getHours()
        );

        if (message) {
          await fetch('/api/twilio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              phoneNumber: messageData.customer_phone,
              threadId: messageData.thread_id
            })
          });
        }
      } catch (twilioError) {
        console.error('Error sending Twilio auto-reply:', twilioError);
      }
    }
    
    return json(
      { success: true, message: record },
      {
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Error creating message:', error);
    return json(
      { success: false, error: 'Failed to create message' },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
};

function isBusinessHours(currentHour: number, businessHours: any) {
  const day = new Date().toLocaleLowerCase();
  const daySettings = businessHours[day];
  
  if (!daySettings?.isOpen) return false;
  
  const [start, end] = daySettings.hours.split(' - ').map(time => {
    const [hour, period] = time.split(' ');
    const [h] = hour.split(':');
    return period === 'PM' ? (parseInt(h) + 12) % 24 : parseInt(h);
  });
  
  return currentHour >= start && currentHour < end;
}

// Add OPTIONS handler for CORS preflight
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};