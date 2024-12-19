import { pb } from '$lib/pocketbase';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';

export const actions: Actions = {
  saveAutoReply: async ({ request, locals }) => {
    const user = locals.user;
    if (!user?.company_id) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const data = await request.formData();
      const autoReplyData = JSON.parse(data.get('autoReplyData') as string);

      const company = await pb.collection('companies').getOne(user.company_id);
      const settings = typeof company.settings === 'string' 
        ? JSON.parse(company.settings) 
        : company.settings || {};

      settings.autoReply = {
        textAutoReply: autoReplyData.textAutoReply,
        businessHoursMessage: autoReplyData.businessHoursMessage,
        afterHoursMessage: autoReplyData.afterHoursMessage,
        leadformBusinessHoursMessage: autoReplyData.leadformBusinessHoursMessage,
        leadformAfterHoursMessage: autoReplyData.leadformAfterHoursMessage,
        businessHours: autoReplyData.businessHours
      };

      await pb.collection('companies').update(user.company_id, {
        settings: JSON.stringify(settings)
      });

      return { type: 'success' };
    } catch (error) {
      console.error('Error saving auto-reply settings:', error);
      return fail(500, { error: 'Failed to save settings' });
    }
  }
};

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user?.company_id) return { autoReply: null };

  try {
    const company = await pb.collection('companies').getOne(user.company_id);
    const settings = typeof company.settings === 'string' 
      ? JSON.parse(company.settings) 
      : company.settings || {};

    return {
      autoReply: settings.autoReply || {
        textAutoReply: false,
        businessHoursMessage: 'Thanks for contacting us. Our team will respond shortly.',
        afterHoursMessage: 'Thanks for contacting us. We are currently closed but will respond during business hours.',
        leadformBusinessHoursMessage: 'Thanks for submitting the form. Our team will respond shortly.',
        leadformAfterHoursMessage: 'Thanks for submitting the form. We are currently closed but will respond during business hours.',
        businessHours: {
          sunday: { isOpen: false, hours: null },
          monday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
          tuesday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
          wednesday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
          thursday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
          friday: { isOpen: true, hours: '8:00 AM - 6:00 PM' },
          saturday: { isOpen: false, hours: null }
        }
      }
    };
  } catch (error) {
    console.error('Error loading auto-reply settings:', error);
    return { autoReply: null };
  }
}; 