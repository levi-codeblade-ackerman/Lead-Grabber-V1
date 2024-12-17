import { pb } from '$lib/pocketbase';
import type { Permission } from '$lib/types/company_member';

export async function checkPermission(
  userId: string,
  companyId: string,
  resource: keyof Permissions,
  action: keyof Permission
): Promise<boolean> {
  try {
    const members = await pb.collection('company_members').getList(1, 1, {
      filter: `user = "${userId}" && company = "${companyId}"`
    });

    if (members.items.length === 0) return false;

    const member = members.items[0];
    return member.permissions[resource][action];
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
} 