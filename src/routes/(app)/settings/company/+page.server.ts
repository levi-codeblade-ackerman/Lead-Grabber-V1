import { pb } from '$lib/pocketbase';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;
    if (!user) {
        return {
            company: null
        };
    }

    try {
        const companies = await pb.collection('companies').getList(1, 1, {
            filter: `owner = "${user.id}"`,
            sort: '-created'
        });

        return {
            company: companies.items[0] || null
        };
    } catch (error) {
        console.error('Error loading company:', error);
        return {
            company: null
        };
    }
};

export const actions: Actions = {
    updateCompany: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { error: 'Unauthorized' });
        }

        try {
            const data = await request.formData();
            const name = data.get('name') as string;
            const website = data.get('website') as string;
            const settings = data.get('settings') as string;

            const companies = await pb.collection('companies').getList(1, 1, {
                filter: `owner = "${user.id}"`
            });

            if (companies.items.length === 0) {
                return fail(404, { error: 'Company not found' });
            }

            const company = companies.items[0];
            const updatedCompany = await pb.collection('companies').update(company.id, {
                name,
                website,
                settings: settings ? JSON.parse(settings) : company.settings
            });

            return {
                success: true,
                company: updatedCompany
            };
        } catch (error) {
            console.error('Error updating company:', error);
            return fail(500, { error: 'Failed to update company' });
        }
    }
}; 