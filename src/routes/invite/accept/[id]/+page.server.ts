import { pb } from '$lib/pocketbase';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
    try {
        // Get invite data first to show info even if not logged in
        const invite = await pb.collection('invites').getOne(params.id, {
            expand: 'company_id,invited_by'
        });

        // Validate invite status and expiry regardless of login state
        if (!invite || invite.status !== 'pending') {
            throw error(400, 'Invalid or expired invitation');
        }

        if (new Date(invite.expires_at) < new Date()) {
            throw error(400, 'This invitation has expired');
        }

        if (!invite.expand?.company_id || !invite.expand?.invited_by) {
            throw error(400, 'Invalid invitation data');
        }

        // If not logged in, return invite data with a flag
        if (!locals.user) {
            return {
                invite: {
                    id: invite.id,
                    email: invite.email,
                    role: invite.role,
                    company: {
                        id: invite.expand.company_id.id,
                        name: invite.expand.company_id.name,
                        logo: invite.expand.company_id.logo
                    },
                    invitedBy: {
                        name: invite.expand.invited_by.name
                    }
                },
                requiresLogin: true
            };
        }

        // If logged in but wrong email
        if (invite.email !== locals.user.email) {
            return {
                invite: {
                    id: invite.id,
                    email: invite.email,
                    role: invite.role,
                    company: {
                        id: invite.expand.company_id.id,
                        name: invite.expand.company_id.name,
                        logo: invite.expand.company_id.logo
                    },
                    invitedBy: {
                        name: invite.expand.invited_by.name
                    }
                },
                wrongEmail: true,
                currentUserEmail: locals.user.email
            };
        }

        // User is logged in with correct email
        return {
            invite: {
                id: invite.id,
                email: invite.email,
                role: invite.role,
                company: {
                    id: invite.expand.company_id.id,
                    name: invite.expand.company_id.name,
                    logo: invite.expand.company_id.logo
                },
                invitedBy: {
                    name: invite.expand.invited_by.name
                }
            }
        };
    } catch (err) {
        console.error('Error loading invite:', err);
        throw error(404, 'Invitation not found');
    }
};

export const actions = {
    default: async ({ request, locals, params }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { error: 'You must be logged in to accept an invitation' });
        }

        try {
            const invite = await pb.collection('invites').getOne(params.id);
            
            if (invite.status !== 'pending') {
                return fail(400, { error: 'Invalid invite' });
            }

            // Create company member with invited role and permissions
            await pb.collection('company_members').create({
                user_id: user.id,
                company_id: invite.company_id,
                role: invite.role,
                permissions: invite.permissions,
                status: 'active',
                joined_at: new Date().toISOString()
            });

            // Update the user's company_id
            await pb.collection('users').update(user.id, {
                company_id: invite.company_id
            });

            // Update invite status
            await pb.collection('invites').update(invite.id, {
                status: 'accepted',
                accepted_at: new Date().toISOString()
            });

            return { success: true };
        } catch (err) {
            console.error('Error accepting invite:', err);
            return fail(500, { error: 'Failed to accept invitation' });
        }
    }
}; 