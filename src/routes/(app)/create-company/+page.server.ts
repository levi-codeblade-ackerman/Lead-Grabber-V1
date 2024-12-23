import { pb } from '$lib/pocketbase';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DEFAULT_PERMISSIONS } from '$lib/types/company_member';

export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;
    if (!user) {
        throw redirect(303, '/login');
    }

    // Check if user already has a company
    const companies = await pb.collection('companies').getList(1, 1, {
        filter: `owner = "${user.id}"`,
    });

    if (companies.items.length > 0) {
        throw redirect(303, '/');
    }

    return {};
};

export const actions: Actions = {
    default: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { error: 'Unauthorized' });
        }

        try {
            const data = await request.formData();
            const name = data.get('name')?.toString();
            const website = data.get('website')?.toString() || '';

            if (!name) {
                return fail(400, { error: 'Company name is required' });
            }

            // Create the company
            const company = await pb.collection('companies').create({
                name,
                website,
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
            });

        
            // Update the user's record with the company ID
            await pb.collection('users').update(user.id, {
                company_id: company.id
            });
            
            // Create company member record for owner
            await pb.collection('company_members').create({
                user: user.id,
                company: company.id,
                role: 'owner',
                permissions: DEFAULT_PERMISSIONS.owner,
                status: 'active',
                joined_at: new Date().toISOString()
            });

            // Update the auth store with the new company_id
            const authData = locals.pb.authStore.model;
            locals.pb.authStore.clear();
            await locals.pb.collection('users').authWithPassword(
                authData.email,
                authData.password
            );
            
            return { success: true };
        } catch (error) {
            console.error('Error creating company:', error);
            return fail(500, { error: 'Failed to create company' });
        }
    }
}; 