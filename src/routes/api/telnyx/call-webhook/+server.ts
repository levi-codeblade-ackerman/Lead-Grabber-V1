import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pb } from '$lib/pocketbase';
import { TELNYX_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Log the webhook event data
    console.log('Received Telnyx webhook:', body.data?.event_type, body.data?.payload?.call_control_id);
    
    // Extract the event type from the webhook payload
    const eventType = body.data?.event_type;
    const callControlId = body.data?.payload?.call_control_id;
    
    // For answering machine detection result
    let detectionResult: string | undefined;
    
    // Process different call events
    switch (eventType) {
      case 'call.initiated':
        console.log('Call initiated:', callControlId);
        await logCallEvent(callControlId, 'initiated', body.data?.payload);
        break;
        
      case 'call.answered':
        console.log('Call answered:', callControlId);
        await logCallEvent(callControlId, 'answered', body.data?.payload);
        
        // Optional: You can play audio when the call is answered
        if (callControlId) {
          await playAudio(callControlId);
        }
        break;
        
      case 'call.hangup':
        console.log('Call hangup:', callControlId);
        await logCallEvent(callControlId, 'ended', body.data?.payload);
        break;
        
      case 'call.machine.detection.ended':
        // Handle answering machine detection
        detectionResult = body.data?.payload?.result;
        console.log('Answering machine detection:', detectionResult);
        
        if (detectionResult === 'machine') {
          console.log('Answering machine detected, leaving a message');
          // Logic for leaving a voicemail
          await logCallEvent(callControlId, 'machine-detection-machine', body.data?.payload);
        } else if (detectionResult === 'human') {
          console.log('Human answered, connecting call');
          // Logic for human answer
          await logCallEvent(callControlId, 'machine-detection-human', body.data?.payload);
        }
        break;
        
      default:
        console.log('Unhandled event:', eventType);
    }
    
    // Always respond with a 200 OK to acknowledge receipt
    return json({ success: true });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};

async function playAudio(callControlId: string): Promise<void> {
  try {
    await fetch(`https://api.telnyx.com/v2/calls/${callControlId}/actions/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TELNYX_API_KEY}`
      },
      body: JSON.stringify({
        payload: "Hello, this is an automated call. Please hold for an important message.",
        voice: "female",
        language: "en-US"
      })
    });
  } catch (error) {
    console.error('Error playing audio:', error);
  }
}

// Log call events to your database
async function logCallEvent(callId: string, status: string, payload: Record<string, any>): Promise<void> {
  try {
    // Extract client state if available
    let clientId = null;
    if (payload.client_state) {
      try {
        const clientState = JSON.parse(payload.client_state);
        clientId = clientState.clientId;
      } catch (err) {
        console.error('Error parsing client state:', err);
      }
    }
    
    // Log the call event to PocketBase or your preferred database
    await pb.collection('call_logs').create({
      call_id: callId,
      status: status,
      to: payload.to || '',
      from: payload.from || '',
      client_id: clientId || '',
      duration: payload.duration || 0,
      timestamp: new Date().toISOString(),
      payload: JSON.stringify(payload)
    });
    
  } catch (dbError) {
    console.error('Error logging call event to database:', dbError);
  }
}

// Also add this for PUT, GET, OPTIONS methods for Telnyx webhook validation
export const GET: RequestHandler = () => json({ success: true });
export const PUT: RequestHandler = async ({ request }) => {
  return await POST({ request } as any);
};
export const OPTIONS: RequestHandler = () => json({ success: true }); 