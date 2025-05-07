import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TELNYX_API_KEY, TELNYX_PHONE_NUMBER } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
  const { message, phoneNumber, threadId } = await request.json();
  
  try {
    // Get your API key from environment variable
    
    // Your Telnyx phone number (from your Messaging Profile)
    const fromNumber = TELNYX_PHONE_NUMBER;
    
    // Format phone number - remove any non-digit characters except leading +
    const formattedPhoneNumber = phoneNumber.replace(/[^+\d]/g, '');
    
    // Call Telnyx API to send SMS
    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TELNYX_API_KEY}`
      },
      body: JSON.stringify({
        from: fromNumber,
        to: formattedPhoneNumber,
        text: message,
        webhook_url: `${PUBLIC_BASE_URL}/api/telnyx/webhook`, 
        webhook_failover_url: `${PUBLIC_BASE_URL}/api/telnyx/webhook-backup`,
        // Use threading reference ID if messaging profile ID isn't what you need
        reference_id: threadId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.errors?.[0]?.detail || 'Failed to send message');
    }
    
    return json({ success: true, telnyxId: result.data?.id, threadId });
  } catch (error) {
    console.error('Telnyx API error:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
};