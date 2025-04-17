import { pb } from '$lib/pocketbase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import twilio from 'twilio';
const MessagingResponse = twilio.twiml.MessagingResponse;

export const POST: RequestHandler = async ({ request }) => {
  console.log('🔔 Webhook endpoint reached');
  
  try {
    let from: string | undefined;
    let body: string | undefined;
    let inReplyTo: string | undefined;

    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const jsonData = await request.json();
      from = jsonData.From?.toString();
      body = jsonData.Body?.toString();
      inReplyTo = jsonData.InReplyTo?.toString();
    } else {
      const formData = await request.formData();
      from = formData.get('From')?.toString();
      body = formData.get('Body')?.toString();
      inReplyTo = formData.get('InReplyTo')?.toString();
    }

    console.log('📨 Received message:', { from, body, inReplyTo });

    if (!from || !body) {
      console.error('❌ Missing required fields');
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Try to find the thread
    let thread;
    try {
      // First try to find by thread_id if inReplyTo is provided
      if (inReplyTo) {
        try {
          thread = await pb.collection('messages').getFirstListItem(`thread_id = "${inReplyTo}"`);
          console.log('📜 Found thread by ID:', thread.id);
        } catch (err) {
          console.log('Thread not found by ID, falling back to phone number');
        }
      }

      // If thread not found by ID, try phone number
      if (!thread) {
        const normalizedPhone = from.replace('+', '');
        console.log('📱 Trying phone number:', normalizedPhone);

        const threads = await pb.collection('messages').getList(1, 1, {
          filter: `customer_phone = "${from}"`,
          sort: '-created'
        });

        if (threads.items.length > 0) {
          thread = threads.items[0];
          console.log('📜 Found thread by phone:', thread.id);
        }
      }

      if (!thread) {
        console.error('❌ No thread found');
        return json({ error: 'No conversation thread found' }, { status: 404 });
      }

      // Update the thread with the new message
      const currentMessages = Array.isArray(thread.messages) ? thread.messages : [];
      const updatedMessages = [...currentMessages, {
        content: body,
        timestamp: new Date().toISOString(),
        is_agent_reply: false
      }];

      const savedMessage = await pb.collection('messages').update(thread.id, {
        messages: updatedMessages,
        status: 'new'  // Mark as new since customer replied
      });

      console.log('✅ Message saved:', savedMessage.id);

      // Return TwiML response
      const twiml = new MessagingResponse();
      return new Response(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });

    } catch (error) {
      console.error('❌ Error processing message:', error);
      return json({ error: 'Failed to process message' }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    const twiml = new MessagingResponse();
    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}; 