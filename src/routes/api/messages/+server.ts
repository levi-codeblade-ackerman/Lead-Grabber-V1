import { pb } from '$lib/pocketbase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TWILIO_ENABLED } from '$env/static/private';

function getAutoReplyMessage(
  source: string,
  autoReplySettings: any,
  currentHour: number
): string | null {
  if (!autoReplySettings?.textAutoReply || !autoReplySettings?.businessHours) {
    return null;
  }

  try {
    const isInBusinessHours = isBusinessHours(currentHour, autoReplySettings.businessHours);
    
    if (source === 'leadform') {
      return isInBusinessHours 
        ? autoReplySettings.leadformBusinessHoursMessage 
        : autoReplySettings.leadformAfterHoursMessage;
    }
    
    return isInBusinessHours 
      ? autoReplySettings.businessHoursMessage 
      : autoReplySettings.afterHoursMessage;
  } catch (error) {
    console.error('Error in getAutoReplyMessage:', error);
    return null;
  }
}

export const POST: RequestHandler = async ({ request, fetch }) => {
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
    let record; // Declare record variable
    
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
    const existingThread = await pb.collection('messages').getFirstListItem(`thread_id="${messageData.thread_id}"`).catch(() => null);

    if (existingThread) {
      // Append to existing thread
      const updatedMessages = [...existingThread.messages, {
        content: messageData.message,
        timestamp: new Date().toISOString(),
        is_agent_reply: messageData.is_agent_reply || false,
        agent_id: messageData.is_agent_reply ? messageData.user_id : undefined,
        agent_name: messageData.is_agent_reply ? messageData.customer_name : undefined
      }];

      record = await pb.collection('messages').update(existingThread.id, {
        messages: updatedMessages,
        status: messageData.status,
        assigned_to: messageData.assigned_to
      });
    } else {
      // Create new thread
      record = await pb.collection('messages').create({
        ...messageData,
        messages: [{
          content: messageData.message,
          timestamp: new Date().toISOString(),
          is_agent_reply: messageData.is_agent_reply || false,
          agent_id: messageData.is_agent_reply ? messageData.user_id : undefined,
          agent_name: messageData.is_agent_reply ? messageData.customer_name : undefined
        }]
      });
    }
    
    // Send auto-reply via Twilio if enabled and phone number exists
    if (TWILIO_ENABLED === 'true' && messageData.customer_phone) {
      try {
        console.log('Attempting to send Twilio auto-reply...');
        const company = await pb.collection('companies').getOne(messageData.company_id);
        console.log('Company settings:', company.settings);
        
        const autoReplySettings = typeof company.settings === 'string' 
          ? JSON.parse(company.settings)?.autoReply
          : company.settings?.autoReply;
        
        console.log('Auto reply settings:', autoReplySettings);
        
        if (autoReplySettings) {
          const message = getAutoReplyMessage(
            messageData.source,
            autoReplySettings,
            new Date().getHours()
          );

          console.log('Auto reply message:', message);

          if (message) {
            console.log('Sending Twilio message to:', messageData.customer_phone);
            const twilioResponse = await fetch('/api/twilio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message,
                phoneNumber: messageData.customer_phone,
                threadId: messageData.thread_id
              })
            });

            const twilioResult = await twilioResponse.json();
            console.log('Twilio API response:', twilioResult);

            if (!twilioResult.success) {
              console.error('Twilio API returned error:', twilioResult.error);
            } else {
              console.log('Twilio message sent successfully!');
            }
          } else {
            console.log('No auto-reply message generated - skipping Twilio send');
          }
        } else {
          console.log('No auto-reply settings found for company');
        }
      } catch (twilioError) {
        console.error('Error sending Twilio auto-reply:', twilioError);
        // Don't throw the error - just log it since auto-reply is not critical
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
  // Get current day name in lowercase
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const daySettings = businessHours?.[day];
  
  if (!daySettings?.isOpen) return false;
  
  if (!daySettings.hours) return false;
  
  const [start, end] = daySettings.hours.split(' - ').map(time => {
    const [hour, period] = time.split(' ');
    const [h] = hour.split(':');
    return period === 'PM' ? (parseInt(h) % 12) + 12 : parseInt(h);
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