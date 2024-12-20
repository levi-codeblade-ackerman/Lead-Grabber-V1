import { json } from '@sveltejs/kit';
import twilio from 'twilio';
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, NODE_ENV } from '$env/static/private';
import type { RequestHandler } from './$types';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Helper function to determine if we should use test number
function getTargetPhoneNumber(phoneNumber: string): string {
  if (NODE_ENV === 'development') {
    return '+17052749564'; // Test number for development
  }
  return phoneNumber;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { message, phoneNumber, threadId } = await request.json();

    if (!message || !phoneNumber) {
      return json({ success: false, error: 'Message and phone number are required' }, { status: 400 });
    }

    const targetNumber = getTargetPhoneNumber(phoneNumber);

    // Send message via Twilio
    const twilioMessage = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: targetNumber,
    });

    // Add a delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    return json({ 
      success: true, 
      messageId: twilioMessage.sid,
      threadId,
      developmentNote: process.env.NODE_ENV === 'development' ? 'Message sent to test number' : undefined
    });

  } catch (error) {
    console.error('Error sending Twilio message:', error);
    return json({ 
      success: false, 
      error: 'Failed to send message' 
    }, { status: 500 });
  }
}; 