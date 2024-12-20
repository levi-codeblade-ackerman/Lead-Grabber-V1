import { pb } from '$lib/pocketbase';

interface ContactData {
  company_id: string;
  name?: string;
  email?: string;
  phone?: string;
}

export async function createOrUpdateContact(data: ContactData) {
  if (!data.name && !data.email && !data.phone) {
    return null;
  }

  try {
    // Build filter based on available contact info
    const filters = [];
    if (data.email) filters.push(`email="${data.email}"`);
    if (data.phone) filters.push(`phone="${data.phone}"`);
    if (data.name) filters.push(`name="${data.name}"`);
    
    // Modified filter to check for combinations of identifiers
    const filterString = filters.length > 0 
      ? `(${filters.join(' || ')}) && company_id="${data.company_id}"` 
      : '';

    // Try to find existing contact
    let contact;
    if (filterString) {
      try {
        // Check for existing contact with same name AND phone, or same email
        const namePhoneFilter = data.name && data.phone 
          ? `(name="${data.name}" && phone="${data.phone}") && company_id="${data.company_id}"`
          : '';
        
        // First try to find by name+phone combination
        if (namePhoneFilter) {
          contact = await pb.collection('contacts').getFirstListItem(namePhoneFilter);
        }
        
        // If not found by name+phone, try other identifiers
        if (!contact) {
          contact = await pb.collection('contacts').getFirstListItem(filterString);
        }
      } catch (err) {
        // Contact not found
      }
    }

    const now = new Date().toISOString().split('.')[0]+"Z";

    // Update existing or create new contact
    if (contact) {
      // Update only if new data is provided
      const updates: any = {
        updated: now
      };
      if (data.name && data.name !== contact.name) updates.name = data.name;
      if (data.email && data.email !== contact.email) updates.email = data.email;
      if (data.phone && data.phone !== contact.phone) updates.phone = data.phone;

      if (Object.keys(updates).length > 0) {
        return await pb.collection('contacts').update(contact.id, updates);
      }
      return contact;
    } else {
      // Create new contact
      const contactData = {
        company_id: data.company_id,
        name: data.name || 'Anonymous',
        email: data.email || '',
        phone: data.phone || '',
        created: now,
        updated: now
      };

      console.log('Creating new contact:', contactData);
      return await pb.collection('contacts').create(contactData);
    }
  } catch (err) {
    console.error('Error in createOrUpdateContact:', err);
    throw err;
  }
} 