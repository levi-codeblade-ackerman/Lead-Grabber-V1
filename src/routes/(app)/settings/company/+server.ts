import { pb } from '$lib/pocketbase';
import { fail } from '@sveltejs/kit';
import { sendEmail } from '$lib/email'; // Create this utility
import { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } from '$env/static/private';
import { PUBLIC_BASE_URL } from '$env/static/public';

// export const actions = {
//   inviteMember: async ({ request, locals }) => {
//     const user = locals.user;
//     if (!user) return fail(401, { error: 'Unauthorized' });

//     try {
//       const data = await request.formData();
//       const email = data.get('email')?.toString();
//       const role = data.get('role')?.toString() || 'member';

//       if (!email) {
//         return fail(400, { error: 'Email is required' });
//       }

//       // Check if user already exists
//       const existingUser = await pb.collection('users').getFirstListItem(`email="${email}"`).catch(() => null);
      
//       if (existingUser) {
//         // Check if already a team member
//         const company = await pb.collection('companies').getOne(user.company_id, {
//           expand: 'team_members'
//         });
        
//         if (company.expand?.team_members?.some((m: any) => m.id === existingUser.id)) {
//           return fail(400, { error: 'User is already a team member' });
//         }

//         // Create invite record
//         const invite = await pb.collection('invites').create({
//           email,
//           company_id: user.company_id,
//           role,
//           status: 'pending',
//           invited_by: user.id,
//           expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
//         });

//         // Send invite email to existing user
//         await sendEmail({
//           to: email,
//           subject: `Invitation to join ${company.name}`,
//           html: `
//             <h1>You've been invited to join ${company.name}</h1>
//             <p>${user.name} has invited you to join their team as a ${role}.</p>
//             <p>Click the link below to accept the invitation:</p>
//             <a href="${PUBLIC_BASE_URL}/invite/accept/${invite.id}">Accept Invitation</a>
//           `
//         });
//       } else {
//         // Create invite for new user
//         const invite = await pb.collection('invites').create({
//           email,
//           company_id: user.company_id,
//           role,
//           status: 'pending',
//           invited_by: user.id,
//           expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
//         });

//         // Send invite email to new user
//         await sendEmail({
//           to: email,
//           subject: `Invitation to join ${company.name}`,
//           html: `
//             <h1>You've been invited to join ${company.name}</h1>
//             <p>${user.name} has invited you to join their team as a ${role}.</p>
//             <p>Click the link below to create an account and accept the invitation:</p>
//             <a href="${PUBLIC_BASE_URL}/signup?invite=${invite.id}">Create Account & Accept Invitation</a>
//           `
//         });
//       }

//       return { success: true };
//     } catch (error) {
//       console.error('Error inviting member:', error);
//       return fail(500, { error: 'Failed to invite team member' });
//     }
//   },

//   resendInvite: async ({ request, locals }) => {
//     const user = locals.user;
//     if (!user) return fail(401, { error: 'Unauthorized' });

//     try {
//       const data = await request.formData();
//       const inviteId = data.get('inviteId')?.toString();

//       if (!inviteId) {
//         return fail(400, { error: 'Invite ID is required' });
//       }

//       const invite = await pb.collection('invites').getOne(inviteId, {
//         expand: 'company_id'
//       });

//       // Update expiration
//       await pb.collection('invites').update(inviteId, {
//         expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
//       });

//       // Resend email
//       await sendEmail({
//         to: invite.email,
//         subject: `Invitation to join ${invite.expand.company_id.name}`,
//         html: `
//           <h1>You've been invited to join ${invite.expand.company_id.name}</h1>
//           <p>${user.name} has invited you to join their team as a ${invite.role}.</p>
//           <p>Click the link below to ${invite.user_id ? 'accept' : 'create an account and accept'} the invitation:</p>
//           <a href="${PUBLIC_BASE_URL}/${invite.user_id ? 'invite/accept' : 'signup'}/${invite.id}">
//             ${invite.user_id ? 'Accept Invitation' : 'Create Account & Accept Invitation'}
//           </a>
//         `
//       });

//       return { success: true };
//     } catch (error) {
//       console.error('Error resending invite:', error);
//       return fail(500, { error: 'Failed to resend invite' });
//     }
//   }
// }; 