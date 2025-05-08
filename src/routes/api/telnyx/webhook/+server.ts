// src/routes/api/telnyx/webhook/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pb } from '$lib/pocketbase';

// Define the handleWebhook function used by PUT
async function handleWebhook(request: Request) {
  return await POST({ request } as Parameters<typeof POST>[0]);
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Log the raw request body for debugging
    const rawBody = await request.text();
    console.log('Webhook raw body:', rawBody);
    
    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    console.log('Webhook payload:', payload);
    
    // Check if this is a Telnyx event webhook or direct inbound message
    let messageData;
    
    if (payload.data?.event_type === 'message.received') {
      // This is a webhook event format
      console.log('Processing webhook event:', payload.data.event_type);
      messageData = payload.data.payload;
    } else if (payload.record_type === 'message' && payload.direction === 'inbound') {
      // This is the direct message format you showed in your logs
      console.log('Processing direct inbound message');
      messageData = payload;
    } else {
      console.log('Unknown webhook format or not an inbound message:', payload);
      return json({ success: true }); // Always return success to Telnyx
    }
    
    // Now extract the message details regardless of format
    const phoneNumber = messageData.from?.phone_number || messageData.from;
    const content = messageData.text;
    const media = messageData.media || [];
    
    if (!phoneNumber) {
      console.error('Missing phone number in webhook:', messageData);
      return json({ success: false, error: 'Missing phone number' });
    }
    
    // Normalize phone number by removing any non-digit characters except leading +
    const normalizedPhoneNumber = phoneNumber.replace(/[^+\d]/g, '');
    console.log('Normalized phone number:', normalizedPhoneNumber);
    
    // Generate a thread ID - use only the customer's phone number
    const threadId = normalizedPhoneNumber;
    console.log('Generated threadId:', threadId);
    
    try {
      // Try to find existing thread by thread_id (which is now the phone number) or customer_phone
      let existingUser;
      try {
        existingUser = await pb.collection('messages').getFirstListItem(
          `thread_id="${normalizedPhoneNumber}" || customer_phone="${normalizedPhoneNumber}"`
        );
        console.log('Found existing thread:', existingUser.id);
      } catch {
        // No existing thread found, which is fine - we'll create one
        console.log('No existing thread found for:', normalizedPhoneNumber);
      }
      
      if (existingUser) {
        // Update existing thread with new message
        const updatedUser = await pb.collection('messages').update(existingUser.id, {
          messages: [...existingUser.messages, {
            content,
            timestamp: new Date().toISOString(),
            is_agent_reply: false,
            media: media.length > 0 ? media : undefined
          }],
          status: 'unread'
        });
        
        console.log('Updated existing thread:', updatedUser.id);
      } else {
        // Extract name from message if possible (like your example "Hello, I'm new customer, Jack")
        let customerName = 'Unknown Customer';
        const nameMatch = content.match(/(?:I'm|I am)\s+(?:new\s+customer,\s+)?([A-Za-z]+)/i);
        if (nameMatch && nameMatch[1]) {
          customerName = nameMatch[1];
        }
        
        // Create new thread without requiring admin/company
        console.log('Creating new thread with default company');
        
        const newThread = await pb.collection('messages').create({
          thread_id: threadId,
          customer_phone: phoneNumber,
          customer_name: customerName,
          messages: [{
            content,
            timestamp: new Date().toISOString(),
            is_agent_reply: false,
            media: media.length > 0 ? media : undefined
          }],
          status: 'new',
          company_id: 'p2aryh9oqlwx4zu' // hardcoded for now
        });
        
        console.log('Created new thread:', newThread.id);
      }
      
      return json({ success: true });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return json({ success: false, error: dbError instanceof Error ? dbError.message : String(dbError) }, { status: 500 });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
};

// Also add this for PUT, GET, OPTIONS methods handling which Telnyx might use
export const GET: RequestHandler = () => json({ success: true });
export const PUT: RequestHandler = async ({ request }) => {
  return await handleWebhook(request);
};
export const OPTIONS: RequestHandler = () => json({ success: true });