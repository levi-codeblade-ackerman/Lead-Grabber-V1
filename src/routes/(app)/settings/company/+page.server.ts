import { pb } from '$lib/pocketbase';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;
    if (!user) {
        throw redirect(303, '/login');
    }

    try {
        // Get user's company
        const companies = await pb.collection('companies').getList(1, 1, {
            filter: `owner = "${user.id}"`,
            sort: '-created'
        });

        const company = companies.items[0];
        if (!company) {
            throw redirect(303, '/create-company');
        }

        return {
            company: {
                ...company,
                settings: typeof company.settings === 'string' 
                    ? JSON.parse(company.settings)
                    : company.settings
            }
        };
    } catch (error) {
        console.error('Error loading company:', error);
        return fail(500, { error: 'Failed to load company' });
    }
};

export const actions = {
    updateCompany: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
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

            const companies = await pb.collection('companies').getList(1, 1, {
                filter: `owner = "${user.id}"`
            });

            if (!companies.items[0]) {
                return fail(404, { error: 'Company not found' });
            }

            const company = companies.items[0];
            const settings = {
                branding: {
                    primary_color: primaryColor,
                    logo_url: '' // Will be updated with the actual logo URL
                },
                notifications: {
                    email: emailNotifications,
                    web: webNotifications
                }
            };

            // Create form data for multipart upload
            const updateData = new FormData();
            updateData.append('name', name);
            updateData.append('website', website);
            updateData.append('settings', JSON.stringify(settings));
            
            // Only append logo if a new file was uploaded
            if (logo && logo.size > 0) {
                updateData.append('logo', logo);
            }

            const updatedCompany = await pb.collection('companies').update(company.id, updateData);

            // Update settings with the actual logo URL if a logo exists
            if (updatedCompany.logo) {
                settings.branding.logo_url = `${pb.baseUrl}/api/files/${updatedCompany.collectionId}/${updatedCompany.id}/${updatedCompany.logo}`;
                await pb.collection('companies').update(company.id, {
                    settings: JSON.stringify(settings)
                });
            }

            return {
                success: true,
                company: {
                    ...updatedCompany,
                    settings: settings
                }
            };
        } catch (error) {
            console.error('Error updating company:', error);
            return fail(500, { error: 'Failed to update company' });
        }
    }
}; 