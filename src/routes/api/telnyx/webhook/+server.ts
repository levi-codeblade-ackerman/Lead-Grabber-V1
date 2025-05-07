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
    const payload = await request.json();
    
    // Verify webhook (optional but recommended)
    // You can use Telnyx's public key to verify the signature
    
    // Handle inbound SMS
    if (payload.data.event_type === 'message.received') {
      const message = payload.data.payload;
      
      // Extract info from the incoming message
      const phoneNumber = message.from.phone_number;
      const content = message.text;
      const media = message.media || [];
      
      // Generate a thread ID or find existing thread
      let threadId = message.to[0].phone_number + '_' + phoneNumber;
      
      try {
        // Try to find existing thread/customer by phone number
        const existingUser = await pb.collection('messages').getFirstListItem(
          `customer_phone="${phoneNumber}"`
        );
        
        if (existingUser) {
          threadId = existingUser.thread_id;
          
          // Update existing thread with new message
          await pb.collection('messages').update(existingUser.id, {
            messages: [...existingUser.messages, {
              content,
              timestamp: new Date().toISOString(),
              is_agent_reply: false,
              media: media.length > 0 ? media : undefined
            }],
            status: 'unread'
          });
        } else {
          // Get first admin/company user
          const adminUser = await pb.collection('users').getFirstListItem('role="owner"');
          
          // Create new thread for new customer
          await pb.collection('messages').create({
            thread_id: threadId,
            customer_phone: phoneNumber,
            customer_name: 'Unknown Customer', // You can update this later
            messages: [{
              content,
              timestamp: new Date().toISOString(),
              is_agent_reply: false,
              media: media.length > 0 ? media : undefined
            }],
            status: 'new',
            company_id: adminUser?.company_id || '' // Default to empty string if no company found
          });
        }
        
        return json({ success: true });
      } catch (dbError) {
        console.error('Database error:', dbError);
        return json({ success: false, error: dbError instanceof Error ? dbError.message : String(dbError) }, { status: 500 });
      }
    }
    
    return json({ success: true });
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