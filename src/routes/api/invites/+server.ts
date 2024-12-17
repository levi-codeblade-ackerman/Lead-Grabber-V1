import { DEFAULT_PERMISSIONS } from "@//types/company_member";

import { pb } from "@//pocketbase";
import { checkPermission } from "@//utils/checkPermission";

export const POST: RequestHandler = async ({ request }) => {
  const { email, role, companyId } = await request.json();
  
  // Only owners and admins can invite new members
  const hasPermission = await checkPermission(
    request.locals.user.id,
    companyId,
    'members',
    'create'
  );
  
  if (!hasPermission) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
  }
  
  const invite = await pb.collection('invites').create({
    email,
    company_id: companyId,
    role, // 'admin' or 'member' only - can't invite owners
    status: 'pending',
    permissions: DEFAULT_PERMISSIONS[role],
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return new Response(JSON.stringify({ invite }));
}; 