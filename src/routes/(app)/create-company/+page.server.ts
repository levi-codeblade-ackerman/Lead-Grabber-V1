import { pb } from '$lib/pocketbase';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

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

            // Create default leadbox
            const defaultLeadbox = await pb.collection('leadboxes').create({
                owner: user.id,
                name: "Default Leadbox",
                status: "active",
                leadbox_data: JSON.stringify({
                    textOnly: true,
                    iconOnly: false,
                    leadBoxOpen: true,
                    primaryIconOnly: false,
                    channels: [
                        { name: "Text", icon: "MessageSquare", value: "Text Us", url: "sms://", target: "_blank", buttonColor: "#40C4AA", showIcon: true },
                        { name: "Call", icon: "Phone", value: "Request a Call", url: "tel://", target: "_blank", buttonColor: "#3B5BDB", showIcon: true },
                        { name: "Watch", icon: "Play", value: "Watch a Demo", url: "https://", target: "_blank", buttonColor: "#3B5BDB", showIcon: true },
                    ],
                    secondaryButton: {
                        text: "Call us now!",
                        icon: "MessageSquare",
                        showIcon: true
                    },
                    logoImage: '/img/gen-can-expo.png'
                })
            });

            // Create default leadform
            const defaultLeadform = await pb.collection('leadforms').create({
                owner: user.id,
                name: "Default Form",
                status: "active",
                form_data: JSON.stringify({
                    title: "Contact Us",
                    description: "We'll get back to you as soon as possible.",
                    fields: [
                        { type: "text", label: "Full Name", required: true, placeholder: "Enter your full name" },
                        { type: "email", label: "Email", required: true, placeholder: "Enter your email" },
                        { type: "tel", label: "Phone", required: true, placeholder: "Enter your phone number" },
                        { type: "textarea", label: "Message", required: false, placeholder: "How can we help you?" }
                    ],
                    submitButtonText: "Send Message"
                })
            });
            
            // Update the user's record with the company ID
            await pb.collection('users').update(user.id, {
                company_id: company.id
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error creating company:', error);
            return fail(500, { error: 'Failed to create company' });
        }
    }
}; 