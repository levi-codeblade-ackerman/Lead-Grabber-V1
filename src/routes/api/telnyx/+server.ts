import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TELNYX_API_KEY, TELNYX_PHONE_NUMBER, TELNYX_MESSAGING_PROFILE_ID } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const POST: RequestHandler = async ({ request }) => {
  const { message, phoneNumber, threadId } = await request.json();
  
  try {
    // Your Telnyx phone number (from your Messaging Profile)
    const fromNumber = TELNYX_PHONE_NUMBER;
    
    // Format phone number - remove any non-digit characters except leading +
    const formattedPhoneNumber = phoneNumber.replace(/[^+\d]/g, '');
    
    // Log the request being sent to Telnyx
    console.log('Sending to Telnyx:', {
      from: fromNumber,
      to: formattedPhoneNumber,
      profileId: TELNYX_MESSAGING_PROFILE_ID,
      apiKeyLength: TELNYX_API_KEY?.length || 0 // Don't log the actual key, just its length for debugging
    });
    
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
        messaging_profile_id: TELNYX_MESSAGING_PROFILE_ID, // Required for SMS/MMS
        webhook_url: `${PUBLIC_BASE_URL}/api/telnyx/webhook`, 
        webhook_failover_url: `${PUBLIC_BASE_URL}/api/telnyx/webhook-backup`,
        use_profile_webhooks: false, // Use our custom webhooks instead of profile defaults
        type: 'SMS' // Explicitly set message type
      })
    });
    
    // Log the full response for debugging
    const responseText = await response.text();
    console.log('Telnyx API raw response:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Telnyx response as JSON:', e);
      throw new Error('Invalid response from Telnyx API');
    }
    
    console.log('Telnyx API parsed response:', result);
    
    if (!response.ok) {
      const errorDetail = result.errors?.[0]?.detail || 'Failed to send message';
      console.error('Telnyx API error:', errorDetail, result);
      throw new Error(errorDetail);
    }
    
    return json({ 
      success: true, 
      telnyxId: result.data?.id, 
      threadId 
    });
  } catch (error) {
    console.error('Telnyx API error:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
};