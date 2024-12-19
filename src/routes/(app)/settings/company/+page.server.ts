import { pb } from '$lib/pocketbase';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { sendEmail } from '$lib/email';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;
    if (!user) {
        throw redirect(303, '/login');
    }

    try {
        // First check if user has a company_id
        if (!user.company_id) {
            console.error('User has no company_id:', user);
            throw redirect(303, '/create-company');
        }

        // Get user's company directly using their company_id
        const company = await pb.collection('companies').getOne(user.company_id, {
            expand: 'team_members'
        });

        // Get company members with expanded user data
        const members = await pb.collection('company_members').getList(1, 50, {
            filter: `company_id = "${user.company_id}" && status = "active"`,
            expand: 'user_id',
            sort: '-created'
        });

        console.log('members', members);

        if (!members.items.length) {
            console.warn('No members found for company:', user.company_id);
        }

        return {
            company: {
                ...company,
                settings: typeof company.settings === 'string' 
                    ? JSON.parse(company.settings)
                    : company.settings || {
                        branding: { primary_color: '#000000' },
                        notifications: { email: true, web: true }
                    }
            },
            members: members.items.map(member => ({
                id: member.id,
                user: member.expand?.user_id,
                role: member.role,
                joined_at: member.joined_at
            }))
        };
    } catch (error) {
        console.error('Error loading company:', error);
        // If company not found or other error, clear the company_id and redirect
        if (error.status === 404 || !user.company_id) {
            await pb.collection('users').update(user.id, {
                company_id: null
            });
            throw redirect(303, '/create-company');
        }
        return {
            company: null,
            members: [],
            error: 'Failed to load company'
        };
    }
};

export const actions: Actions = {
    updateCompany: async ({ request, locals }) => {
        const user = locals.user;
        if (!user?.company_id) {
            return fail(401, { error: 'Unauthorized' });
        }

        try {
            const formData = await request.formData();
            const name = formData.get('name') as string;
            const website = formData.get('website') as string;
            const primaryColor = formData.get('primaryColor') as string;
            const logo = formData.get('logo') as File;
            const emailNotifications = formData.get('emailNotifications') === 'true';
            const webNotifications = formData.get('webNotifications') === 'true';

            // Get current company
            const company = await pb.collection('companies').getOne(user.company_id);

            // Check if user is owner or admin
            if (company.owner !== user.id) {
                return fail(403, { error: 'Only company owners can update company settings' });
            }

            const updateData: any = {
                name,
                website,
                settings: JSON.stringify({
                    branding: { primary_color: primaryColor },
                    notifications: {
                        email: emailNotifications,
                        web: webNotifications
                    }
                })
            };

            if (logo instanceof File && logo.size > 0) {
                updateData.logo = logo;
            }

            await pb.collection('companies').update(company.id, updateData);
            return { success: true };
        } catch (error) {
            console.error('Error updating company:', error);
            return fail(500, { error: 'Failed to update company' });
        }
    },

    inviteMember: async ({ request, locals }) => {
        const user = locals.user;
        if (!user?.company_id) {
            return fail(401, { error: 'Unauthorized' });
        }

        try {
            const data = await request.formData();
            const email = data.get('email')?.toString();
            const role = data.get('role')?.toString() || 'member';

            // Validate role
            if (!['admin', 'member'].includes(role)) {
                return fail(400, { error: 'Invalid role. Only admin and member roles are allowed.' });
            }

            if (!email) {
                return fail(400, { error: 'Email is required' });
            }

            // Get company and check if user has permission to invite
            const company = await pb.collection('companies').getOne(user.company_id, {
                expand: 'team_members'
            });

            if (company.owner !== user.id) {
                return fail(403, { error: 'Only company owners can invite members' });
            }

            // Check if user already exists
            const existingUser = await pb.collection('users').getFirstListItem(`email="${email}"`).catch(() => null);

            // Create invite record
            const invite = await pb.collection('invites').create({
                email,
                company_id: user.company_id,
                role,
                status: 'pending',
                invited_by: user.id,
                user_id: existingUser?.id || null, // Make user_id optional
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