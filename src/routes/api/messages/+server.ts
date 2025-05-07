import { pb } from '$lib/pocketbase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TWILIO_ENABLED } from '$env/static/private';
import { createOrUpdateContact } from '$lib/utils/contacts';

function getAutoReplyMessage(
  source: string,
  autoReplySettings: any,
  currentHour: number
): string | null {
  if (!autoReplySettings?.textAutoReply || !autoReplySettings?.businessHours) {
    return null;
  }

  try {
    const hours = isBusinessHours(currentHour, autoReplySettings.businessHours);
    const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    if (source === 'leadform') {
      if (hours.isClosed) {
        return `${autoReplySettings.leadformAfterHoursMessage} We are closed on ${day}s.`;
      }
      return hours.isOpen 
        ? autoReplySettings.leadformBusinessHoursMessage 
        : autoReplySettings.leadformAfterHoursMessage;
    }
    
    if (hours.isClosed) {
      return `${autoReplySettings.afterHoursMessage} We are closed on ${day}s.`;
    }
    return hours.isOpen 
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

    // Create or update contact if we have contact info
    if (messageData.customer_name || messageData.customer_email || messageData.customer_phone) {
      try {
        await createOrUpdateContact({
          company_id: messageData.company_id,
          name: messageData.customer_name,
          email: messageData.customer_email,
          phone: messageData.customer_phone
        });
      } catch (err) {
        console.error('Error creating/updating contact:', err);
        // Continue with message creation even if contact creation fails
      }
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
              },
              autoReply: {
                textAutoReply: false,
                businessHoursMessage: 'Thanks for contacting us. Our team will respond shortly.',
                afterHoursMessage: 'Thanks for contacting us. We are currently closed but will respond during business hours.',
                leadformBusinessHoursMessage: 'Thanks for submitting the form. Our team will respond shortly.',
                leadformAfterHoursMessage: 'Thanks for submitting the form. We are currently closed but will respond during business hours.',
                businessHours: {
                  sunday: { isOpen: false, hours: null },
                  monday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
                  tuesday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
                  wednesday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
                  thursday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
                  friday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
                  saturday: { isOpen: false, hours: null }
                }
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
    
    // Normalize phone number if available
    if (messageData.customer_phone) {
      const normalizedPhone = messageData.customer_phone.replace(/[^+\d]/g, '');
      
      // Update both the thread_id and customer_phone for consistency
      if (normalizedPhone) {
        messageData.customer_phone = normalizedPhone;
        
        // If no thread_id is provided, use the phone number
        if (!messageData.thread_id) {
          messageData.thread_id = normalizedPhone;
        }
      }
    }
    
    // Create the message in PocketBase
    // Try to find existing thread by thread_id or customer_phone
    let existingThread = null;
    
    try {
      if (messageData.thread_id) {
        existingThread = await pb.collection('messages').getFirstListItem(`thread_id="${messageData.thread_id}"`).catch(() => null);
      }
      
      // If not found by thread_id and we have a phone number, try to find by phone
      if (!existingThread && messageData.customer_phone) {
        existingThread = await pb.collection('messages').getFirstListItem(`customer_phone="${messageData.customer_phone}"`).catch(() => null);
        
        // If found by phone, update the thread_id to match the phone for future consistency
        if (existingThread && !existingThread.thread_id.includes(messageData.customer_phone)) {
          await pb.collection('messages').update(existingThread.id, {
            thread_id: messageData.customer_phone
          });
          existingThread.thread_id = messageData.customer_phone;
        }
      }
    } catch (error) {
      console.error('Error finding existing thread:', error);
    }

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
      // If we have a phone number, use it as the thread_id
      if (messageData.customer_phone && !messageData.thread_id) {
        messageData.thread_id = messageData.customer_phone;
      }
      
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
          ? JSON.parse(company.settings)?.autoReply || getDefaultAutoReplySettings()
          : company.settings?.autoReply || getDefaultAutoReplySettings();
        
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
  
  // If the day is marked as closed (not open or no hours), return false
  if (!daySettings?.isOpen || !daySettings.hours) {
    return {
      isOpen: false,
      isClosed: true  // Explicitly indicate it's a closed day
    };
  }
  
  const [start, end] = daySettings.hours.split(' - ').map(time => {
    const [hour, period] = time.split(' ');
    const [h] = hour.split(':');
    return period === 'PM' ? (parseInt(h) % 12) + 12 : parseInt(h);
  });
  
  return {
    isOpen: currentHour >= start && currentHour < end,
    isClosed: false
  };
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

function getDefaultAutoReplySettings() {
  return {
    textAutoReply: false,
    businessHoursMessage: 'Thanks for contacting us. Our team will respond shortly.',
    afterHoursMessage: 'Thanks for contacting us. We are currently closed but will respond during business hours.',
    leadformBusinessHoursMessage: 'Thanks for submitting the form. Our team will respond shortly.',
    leadformAfterHoursMessage: 'Thanks for submitting the form. We are currently closed but will respond during business hours.',
    businessHours: {
      sunday: { isOpen: false, hours: null },
      monday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
      tuesday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
      wednesday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
      thursday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
      friday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
      saturday: { isOpen: false, hours: null }
    }
  };
}