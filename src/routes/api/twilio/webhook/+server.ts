import { pb } from '$lib/pocketbase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createOrUpdateContact } from '$lib/utils/contacts';
import twilio from 'twilio';
const MessagingResponse = twilio.twiml.MessagingResponse;

export const POST: RequestHandler = async ({ request }) => {
  console.log('🔔 Webhook endpoint reached');
  console.log('Request headers:', Object.fromEntries(request.headers));
  
  try {
    const formData = await request.formData();
    console.log('📨 Received form data:', Object.fromEntries(formData));

    const from = formData.get('From')?.toString();
    const body = formData.get('Body')?.toString();
    const to = formData.get('To')?.toString();

    console.log('📱 SMS Details:', { from, to, body });

    if (!from || !body || !to) {
      console.error('❌ Missing required fields:', { from, body, to });
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the company by the Twilio phone number
    console.log('🔍 Looking for company with Twilio number:', to);
    const company = await pb.collection('companies').getFirstListItem(`settings.twilio_phone_number="${to}"`);
    if (!company) {
      console.error('❌ No company found for Twilio number:', to);
      return json({ error: 'Company not found' }, { status: 404 });
    }
    console.log('🏢 Found company:', { id: company.id, name: company.name });

    // Create or update contact
    console.log('👤 Creating/updating contact for phone:', from);
    const contact = await createOrUpdateContact({
      company_id: company.id,
      phone: from,
      name: '', // Can be updated later through the UI
    });

    if (!contact) {
      console.error('❌ Failed to create/update contact');
      throw new Error('Failed to create/update contact');
    }
    console.log('✅ Contact created/updated:', contact);

    // Find existing thread or create new one
    let thread;
    try {
      console.log('🔍 Looking for existing thread');
      thread = await pb.collection('messages').getFirstListItem(`
        company_id="${company.id}" && 
        customer_id="${contact.id}" && 
        thread_id != "" && 
        created >= "${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}"
      `);
      console.log('📜 Found existing thread:', thread);
    } catch (err) {
      console.log('📝 No recent thread found, will create new one');
    }

    // Create message record
    const messageData = {
      company_id: company.id,
      customer_id: contact.id,
      thread_id: thread?.thread_id || crypto.randomUUID(),
      direction: 'inbound',
      channel: 'sms',
      content: body,
      status: 'unread',
      messages: thread?.messages || [],
    };

    // Add the new message to the messages array
    messageData.messages.push({
      content: body,
      direction: 'inbound',
      timestamp: new Date().toISOString(),
    });

    console.log('💾 Saving message:', messageData);
    // Create or update the message thread
    const savedMessage = await pb.collection('messages').create(messageData);
    console.log('✅ Message saved:', savedMessage);

    // Create TwiML response
    const twiml = new MessagingResponse();
    
    // Get auto-reply settings from company
    console.log('⚙️ Getting auto-reply settings');
    const settings = typeof company.settings === 'string' 
      ? JSON.parse(company.settings) 
      : company.settings;
    console.log('📋 Company settings:', settings);

    if (settings?.autoReply?.textAutoReply) {
      const currentHour = new Date().getHours();
      const businessHours = settings.autoReply.businessHours || {};
      const isBusinessHours = currentHour >= (businessHours.start || 9) && 
                            currentHour < (businessHours.end || 17);

      console.log('⏰ Business hours check:', {
        currentHour,
        businessHours,
        isBusinessHours
      });

      const replyMessage = isBusinessHours 
        ? settings.autoReply.businessHoursMessage 
        : settings.autoReply.afterHoursMessage;

      if (replyMessage) {
        console.log('↩️ Sending auto-reply:', replyMessage);
        twiml.message(replyMessage);
      }
    }

    const response = twiml.toString();
    console.log('📤 Sending TwiML response:', response);

    // Return TwiML response
    return new Response(response, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('❌ Error in webhook:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    // Even on error, we should return a valid TwiML response
    const twiml = new MessagingResponse();
    const response = twiml.toString();
    console.log('📤 Sending error TwiML response:', response);
    
    return new Response(response, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}; 