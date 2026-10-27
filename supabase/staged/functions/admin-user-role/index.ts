// STAGED — not deployed. Replaces supabase/functions/admin-user-role/index.ts
// Requires staged SQL: replace_user_roles (atomic, service_role only).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { json, loadDeptIds, loadRoles, requireCaller, serviceClient } from '../_shared/caller.ts';
import { authorizeRoleChange, isUuid } from '../_shared/policies.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    const admin = serviceClient();
    const caller = await requireCaller(req, admin);
    if (caller instanceof Response) return caller;

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const userId = body?.userId;
    const requested: unknown[] = Array.isArray(body?.roles) ? body!.roles as unknown[] : body?.role ? [body.role] : [];
    if (!isUuid(userId)) return json(400, { error: 'invalid_user_id' });

    const { data: target, error: tErr } = await admin.from('profiles').select('id, name').eq('id', userId).maybeSingle();
    if (tErr) return json(500, { error: 'lookup_failed' });
    if (!target) return json(404, { error: 'target_not_found' });

    let targetRoles: string[], targetDeptIds: string[];
    try {
      [targetRoles, targetDeptIds] = await Promise.all([loadRoles(admin, userId), loadDeptIds(admin, userId)]);
    } catch { return json(500, { error: 'authorization_lookup_failed' }); }

    const decision = authorizeRoleChange({
      callerId: caller.id, callerRoles: caller.roles, callerDeptIds: caller.deptIds,
      targetId: userId, targetCurrentRoles: targetRoles, targetDeptIds, requestedRoles: requested,
    });
    if (!decision.ok) {
      console.warn(`[admin-user-role ${requestId}] denied ${decision.code}`);
      return json(decision.status, { error: decision.code });
    }

    const uniqueRoles = Array.from(new Set(requested as string[]));
    const { data: newRoles, error: rpcErr } = await admin.rpc('replace_user_roles', {
      p_user_id: userId, p_roles: uniqueRoles,
    });
    if (rpcErr) {
      console.error(`[admin-user-role ${requestId}] replace failed`, rpcErr.code);
      return json(500, { error: 'role_update_failed' });
    }
    await admin.from('planner_change_log').select('id').limit(0); // no-op keep-alive; audit via security log below
    await admin.rpc('log_security_event', {
      event_type: 'user_roles_replaced',
      event_message: 'Roles replaced via admin-user-role',
      event_details: { target: userId, by: caller.id, roles: newRoles },
    }).then(() => undefined, () => undefined); // best-effort audit; role change already committed atomically

    return json(200, { success: true, user: { id: target.id, name: target.name, newRoles } });
  } catch (err) {
    console.error(`[admin-user-role ${requestId}] error`, (err as { message?: string })?.message);
    return json(500, { error: 'internal_error' });
  }
});
