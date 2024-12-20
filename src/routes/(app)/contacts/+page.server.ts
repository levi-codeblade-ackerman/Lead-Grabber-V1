import { pb } from '$lib/pocketbase';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const user = locals.user;
    
    if (!user) {
        throw redirect(303, '/login');
    }

    try {
        // Fetch contacts for the user's company
        const contacts = await pb.collection('contacts').getList(1, 50, {
            filter: `company_id = "${user.company_id}"`,
            sort: '-created'
        });

        return {
            contacts: contacts.items
        };
    } catch (error) {
        console.error('Error loading contacts:', error);
        return {
            contacts: []
        };
    }
};

export const actions: Actions = {
    deleteContact: async ({ request, locals }) => {
        const user = locals.user;
        if (!user?.company_id) {
            return fail(401, { error: 'Unauthorized' });
        }

        try {
            const data = await request.formData();
            const contactId = data.get('contactId')?.toString();

            if (!contactId) {
                return fail(400, { error: 'Contact ID is required' });
            }

            await pb.collection('contacts').delete(contactId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting contact:', error);
            return fail(500, { error: 'Failed to delete contact' });
        }
    }
}; 