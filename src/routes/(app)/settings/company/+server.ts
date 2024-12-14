import { fail } from "@sveltejs/kit";

import { pb } from "@//pocketbase";

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
      const existingUser = await pb.collection('users').getFirstListItem(`email="${email}"`);
      
      if (existingUser) {
        // Add existing user to company
        const company = await pb.collection('companies').getOne(user.company_id, {
          expand: 'team_members'
        });
        
        if (company.expand?.team_members?.some((m: any) => m.id === existingUser.id)) {
          return fail(400, { error: 'User is already a team member' });
        }

        // Update company team members
        await pb.collection('companies').update(company.id, {
          team_members: [...company.team_members, existingUser.id]
        });

        // Update user's company association
        await pb.collection('users').update(existingUser.id, {
          company_id: company.id,
          role: role
        });
      } else {
        // Create invite record
        await pb.collection('invites').create({
          email,
          company_id: user.company_id,
          role,
          status: 'pending',
          invited_by: user.id
        });

        // Send invite email (implement email service)
      }

      return { success: true };
    } catch (error) {
      console.error('Error inviting member:', error);
      return fail(500, { error: 'Failed to invite team member' });
    }
  }
}; 