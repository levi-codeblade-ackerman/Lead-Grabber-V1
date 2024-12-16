import { pb } from '$lib/pocketbase';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
    const user = locals.user;
    if (!user) {
        throw redirect(303, `/login?redirect=/invite/accept/${params.id}`);
    }

    try {
        // Get invite details with expanded company and inviter info
        const invite = await pb.collection('invites').getOne(params.id, {
            expand: 'company_id,invited_by,user_id'
        });

        // Validate invite
        if (!invite || invite.status !== 'pending') {
            throw error(400, 'Invalid or expired invitation');
        }

        // Check if invite is for this user
        if (invite.email !== user.email) {
            throw error(403, 'This invitation is for a different email address');
        }

        // Check if invite is expired
        if (new Date(invite.expires_at) < new Date()) {
            throw error(400, 'This invitation has expired');
        }

        // Get company details
        const company = invite.expand?.company_id;
        const invitedBy = invite.expand?.invited_by;

        if (!company || !invitedBy) {
            throw error(400, 'Invalid invitation data');
        }

        return {
            invite: {
                id: invite.id,
                email: invite.email,
                role: invite.role,
                status: invite.status,
                expires_at: invite.expires_at,
                company: {
                    id: company.id,
                    name: company.name,
                    logo: company.logo
                },
                invitedBy: {
                    name: invitedBy.name,
                    email: invitedBy.email
                }
            }
        };
    } catch (err: any) {
        console.error('Error loading invite:', err);
        if (err.status) throw err;
        throw error(500, 'Failed to load invitation');
    }
};

export const actions = {
    accept: async ({ params, locals }) => {
        const user = locals.user;
        if (!user) {
            throw error(401, 'Unauthorized');
        }

        try {
            const invite = await pb.collection('invites').getOne(params.id);
            
            // Get the company
            const company = await pb.collection('companies').getOne(invite.company_id);
            
            // First update the company to add the user to team_members
            await pb.collection('companies').update(invite.company_id, {
                team_members: [...(company.team_members || []), user.id]
            });

            // Then update the user's company_id
            await pb.collection('users').update(user.id, {
                company_id: invite.company_id
            });

            // Mark invite as accepted
            await pb.collection('invites').update(invite.id, {
                status: 'accepted',
                accepted_at: new Date().toISOString()
            });

            throw redirect(303, '/');
        } catch (err) {
            console.error('Error accepting invite:', err);
            if (err instanceof Error) {
                throw error(500, err.message);
            }
            throw error(500, 'Failed to accept invitation');
        }
    }
} satisfies Actions; 