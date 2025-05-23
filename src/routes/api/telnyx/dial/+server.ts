import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TELNYX_API_KEY, TELNYX_CONNECTION_ID } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { to, from, clientId } = await request.json();
    
    if (!to) {
      return json({ success: false, error: 'Missing destination phone number' }, { status: 400 });
    }
    
    // Clean the phone number
    const cleanedPhone = to.replace(/\D/g, '');
    
    // For international calls, format appropriately
    const formattedPhone = cleanedPhone.startsWith('1') 
      ? `+${cleanedPhone}` 
      : `+1${cleanedPhone}`;
    
    // Create the call using Telnyx API
    const response = await fetch('https://api.telnyx.com/v2/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TELNYX_API_KEY}`
      },
      body: JSON.stringify({
        connection_id: TELNYX_CONNECTION_ID,
        to: formattedPhone,
        from: from,
        send_silence_when_idle: false, // Ensures continuous audio
        client_state: clientId ? btoa(JSON.stringify({ clientId })) : undefined,
        webhook_url: `${request.headers.get('origin')}/api/telnyx/call-webhook`, // Ensure webhooks are properly routed
        // Optional: Enable answering machine detection if needed
        answering_machine_detection: 'detect',
        answering_machine_detection_config: {
          total_analysis_time_millis: 5000,
          after_greeting_silence_millis: 800
        }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Telnyx API error:', data);
      return json({ 
        success: false, 
        error: data.errors?.[0]?.detail || 'Failed to initiate call' 
      }, { status: 500 });
    }
    
    // Return the call ID and success status
    return json({ 
      success: true, 
      callId: data.data.call_control_id,
      callLegId: data.data.call_leg_id
    });
    
  } catch (error) {
    console.error('Error initiating call:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}; 