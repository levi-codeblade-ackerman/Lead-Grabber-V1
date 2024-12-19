import { json } from '@sveltejs/kit';
import twilio from 'twilio';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from '$env/static/private';
import type { RequestHandler } from './$types';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { message, phoneNumber, threadId } = await request.json();

    if (!message || !phoneNumber) {
      return json({ success: false, error: 'Message and phone number are required' }, { status: 400 });
    }

    // Send message via Twilio
    const twilioMessage = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return json({ 
      success: true, 
      messageId: twilioMessage.sid,
      threadId 
    });

  } catch (error) {
    console.error('Error sending Twilio message:', error);
    return json({ 
      success: false, 
      error: 'Failed to send message' 
    }, { status: 500 });
  }
}; 