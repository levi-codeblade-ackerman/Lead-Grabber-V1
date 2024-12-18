import { pb } from '$lib/pocketbase';
import { fail } from '@sveltejs/kit';
import { sendEmail } from '$lib/email'; // Create this utility
import { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const actions = {
  inviteMember: async ({ request, locals }) => {
    const user = locals.user;
    if (!user) return fail(401, { error: 'Unauthorized' });

    try {
      const data = await request.formData();
      const email = data.get('email')?.toString();
      const role = data.get('role')?.toString() || 'member';

      if (!email) {
        return fail(400, { error: 'Email is required' });
      }

      // Check if user already exists
      let existingUser;
      try {
        existingUser = await pb.collection('users').getFirstListItem(`email="${email}"`);
        console.log('Existing user found:', existingUser);
      } catch (error) {
        console.error('Error fetching user:', error);
        return fail(400, { error: 'User must create an account before being invited' });
      }

      if (!existingUser) {
        console.log('No user found with email:', email);
        return fail(400, { error: 'User must create an account before being invited' });
      }

      // Ensure email visibility is true
      if (!existingUser.emailVisibility) {
        try {
          const updateData = { emailVisibility: true };
          await pb.collection('users').update(existingUser.id, updateData);
          console.log('Email visibility set to true for user:', existingUser.id);
        } catch (error) {
          console.error('Error updating email visibility:', error);
          return fail(500, { error: 'Failed to update email visibility' });
        }
      }

      // Check if already a team member
      const company = await pb.collection('companies').getOne(user.company_id, {
        expand: 'team_members'
      });
      
      if (company.expand?.team_members?.some((m: any) => m.id === existingUser.id)) {
        return fail(400, { error: 'User is already a team member' });
      }

      // Create invite record
      const invite = await pb.collection('invites').create({
        email,
        company_id: user.company_id,
        role,
        status: 'pending',
        invited_by: user.id,
        user_id: existingUser.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Send invite email
      await sendEmail({
        to: email,
        subject: `Invitation to join ${company.name}`,
        html: `
          <h1>You've been invited to join ${company.name}</h1>
          <p>${user.name} has invited you to join their team.</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="${PUBLIC_BASE_URL}/invite/accept/${invite.id}">Accept Invitation</a>
        `
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending invite:', error);
      return fail(500, { error: 'Failed to send invitation' });
    }
  }
}; 