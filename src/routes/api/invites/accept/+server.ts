import type { RequestHandler } from './$types';
import { pb } from '$lib/pocketbase';

export const POST: RequestHandler = async ({ request }) => {
  const { inviteId, userId } = await request.json();
  
  const invite = await pb.collection('invites').getOne(inviteId);
  
  if (invite.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Invalid invite' }), { status: 400 });
  }
  
  try {
    // Create company member with invited role and permissions
    await pb.collection('company_members').create({
      user_id: userId,
      company_id: invite.company_id,
      role: invite.role,
      permissions: invite.permissions,
      status: 'active',
      joined_at: new Date().toISOString()
    });

    // Update the user's company_id
    await pb.collection('users').update(userId, {
      company_id: invite.company_id
    });

    // Update invite status
    await pb.collection('invites').update(inviteId, {
      status: 'accepted',
      accepted_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('Error accepting invite:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to accept invitation' }), 
      { status: 500 }
    );
  }
}; 