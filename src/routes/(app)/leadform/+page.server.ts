import { pb } from '$lib/pocketbase';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load = async ({ locals }) => {
    const user = locals.user;
    
    if (!user) {
        return {
            user: null,
            form: null
        };
    }

    try {
        // Fetch the user's existing form
        const existingForms = await pb.collection('leadforms').getList(1, 1, {
            filter: `owner = "${user.id}"`
        });

        // Check if form_data is already an object
        const form = existingForms.items[0] ? {
            ...existingForms.items[0],
            form_data: typeof existingForms.items[0].form_data === 'string' 
                ? JSON.parse(existingForms.items[0].form_data)
                : existingForms.items[0].form_data
        } : null;

        return {
            user,
            form
        };
    } catch (error) {
        console.error('Error loading form:', error);
        return {
            user,
            form: null
        };
    }
};

export const actions = {
    saveForm: async ({ request, locals }) => {
        try {
            const data = await request.formData();
            const formDataJson = data.get('formData');
            
            if (!formDataJson || typeof formDataJson !== 'string') {
                return fail(400, {
                    success: false,
                    message: 'Invalid form data'
                });
            }

            const parsedData = JSON.parse(formDataJson);
            const user = locals.user;

            if (!user) {
                return fail(401, {
                    success: false,
                    message: 'Unauthorized'
                });
            }

            const formDataToSave = {
                form_data: JSON.stringify({
                    settings: parsedData.settings,
                    formElements: parsedData.formElements
                }),
                owner: user.id,
                Name: parsedData.settings.heading
            };

            const existingForms = await pb.collection('leadforms').getList(1, 1, {
                filter: `owner = "${user.id}"`
            });

            let result;
            if (existingForms.items.length > 0) {
                result = await pb.collection('leadforms').update(existingForms.items[0].id, formDataToSave);
            } else {
                result = await pb.collection('leadforms').create(formDataToSave);
            }

            return {
                success: true,
                message: 'Form saved successfully!',
                form: result
            };
        } catch (error) {
            console.error('Error saving form:', error);
            return fail(500, {
                success: false,
                message: 'Error saving form. Please try again.'
            });
        }
    }
} satisfies Actions;