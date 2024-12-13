import { pb } from '$lib/pocketbase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const messageData = await request.json();
    
    // Verify company exists
    try {
      await pb.collection('companies').getOne(messageData.company_id);
    } catch (err) {
      // If company doesn't exist, try to create a default one
      const user = await pb.collection('users').getOne(messageData.company_id);
      const companyData = {
        name: `${user.name}'s Company`,
        owner: user.id,
        team_members: [user.id],
        settings: JSON.stringify({
          branding: {
            primary_color: '#3B5BDB',
            logo_url: ''
          },
          notifications: {
            email: true,
            web: true
          }
        })
      };
      
      const company = await pb.collection('companies').create(companyData);
      messageData.company_id = company.id;
    }
    
    // Create the message in PocketBase
    const record = await pb.collection('messages').create(messageData);
    
    return json(
      { success: true, message: record },
      {
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Error creating message:', error);
    return json(
      { success: false, error: 'Failed to create message' },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
};

// Add OPTIONS handler for CORS preflight
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
};