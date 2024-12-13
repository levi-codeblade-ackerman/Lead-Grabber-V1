import { pb } from '$lib/pocketbase';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load = async ({ locals }) => {
    const user = locals.user;
    
    if (!user) {
        throw redirect(303, '/login');
    }

    try {
        // Check if user has a company
        const companies = await pb.collection('companies').getList(1, 1, {
            filter: `owner = "${user.id}"`,
        });

        if (companies.items.length === 0) {
            throw redirect(303, '/create-company');
        }

        // Fetch the user's existing leadbox
        const existingLeadboxes = await pb.collection('leadboxes').getList(1, 1, {
            filter: `owner = "${user.id}"`,
            sort: '-created'
        });

        // Check if leadbox_data is already an object
        const leadbox = existingLeadboxes.items[0] ? {
            ...existingLeadboxes.items[0],
            leadbox_data: typeof existingLeadboxes.items[0].leadbox_data === 'string' 
                ? JSON.parse(existingLeadboxes.items[0].leadbox_data)
                : existingLeadboxes.items[0].leadbox_data
        } : null;

        return {
            user,
            leadbox
        };
    } catch (error) {
        console.error('Error loading leadbox:', error);
        return {
            user,
            leadbox: null
        };
    }
};

export const actions = {
    saveLeadbox: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { error: 'Unauthorized' });
        }

        try {
            const data = await request.formData();
            const leadboxDataJson = data.get('leadboxData');
            
            if (!leadboxDataJson || typeof leadboxDataJson !== 'string') {
                return fail(400, {
                    success: false,
                    message: 'Invalid leadbox data'
                });
            }

            const parsedData = JSON.parse(leadboxDataJson);

            const leadboxDataToSave = {
                leadbox_data: parsedData,
                owner: user.id,
                name: "Default Leadbox",
                status: "active"
            };

            const existingLeadboxes = await pb.collection('leadboxes').getList(1, 1, {
                filter: `owner = "${user.id}"`
            });

            let result;
            if (existingLeadboxes.items.length > 0) {
                result = await pb.collection('leadboxes').update(existingLeadboxes.items[0].id, leadboxDataToSave);
            } else {
                result = await pb.collection('leadboxes').create(leadboxDataToSave);
            }
            console.log("res",result);
            return {
                type: 'success',
                data: {
                    message: 'Leadbox saved successfully!',
                    leadbox: result
                }
            };
        } catch (error) {
            console.error('Error saving leadbox:', error);
            return fail(500, {
                type: 'error',
                message: 'Error saving leadbox. Please try again.'
            });
        }
    }
};