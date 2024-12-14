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
                    settings: {
                        heading: "Contact Us",
                        intro: "We'll get back to you as soon as possible.",
                        buttonText: "Send Message",
                        buttonColor: "#2E53D9",
                        privacyPolicy: {
                            type: "default",
                            link: ""
                        },
                        customConfirmation: {
                            type: "default",
                            link: ""
                        }
                    },
                    formElements: [
                        {
                            id: "name",
                            type: "text",
                            label: "Full Name",
                            required: true,
                            isDefault: true
                        },
                        {
                            id: "email",
                            type: "email",
                            label: "Email",
                            required: true,
                            isDefault: true
                        },
                        {
                            id: "phone",
                            type: "phone",
                            label: "Phone",
                            required: true,
                            isDefault: true
                        },
                        {
                            id: "message",
                            type: "message",
                            label: "Message",
                            required: true,
                            isDefault: true
                        }
                    ]
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