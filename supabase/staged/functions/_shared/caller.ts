// STAGED — not deployed. Copy to supabase/functions/_shared/caller.ts at rollout.
// Resolves the REAL caller from the JWT (never from the request body) and loads
// roles + department memberships with the service-role client.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

export type Caller = { id: string; roles: string[]; deptIds: string[] };

export function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('server_misconfigured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function loadDeptIds(admin: SupabaseClient, userId: string): Promise<string[]> {
  const [{ data: access, error: aErr }, { data: prof, error: pErr }] = await Promise.all([
    admin.from('user_access').select('department_id').eq('user_id', userId),
    admin.from('profiles').select('home_department_id').eq('id', userId).maybeSingle(),
  ]);
  if (aErr || pErr) throw new Error('department_lookup_failed');
  const ids = new Set<string>();
  for (const r of access ?? []) if (r.department_id) ids.add(r.department_id as string);
  if (prof?.home_department_id) ids.add(prof.home_department_id as string);
  return [...ids];
}

export async function loadRoles(admin: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await admin.from('user_roles').select('role').eq('user_id', userId);
  if (error) throw new Error('role_lookup_failed');
  return (data ?? []).map((r: { role: string }) => r.role);
}

/** Returns the caller or a 401 Response. Any lookup failure fails closed (500). */
export async function requireCaller(req: Request, admin: SupabaseClient): Promise<Caller | Response> {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return json(401, { error: 'unauthorized' });
  const { data, error } = await admin.auth.getUser(auth.slice(7).trim());
  if (error || !data?.user) return json(401, { error: 'unauthorized' });
  try {
    const [roles, deptIds] = await Promise.all([loadRoles(admin, data.user.id), loadDeptIds(admin, data.user.id)]);
    return { id: data.user.id, roles, deptIds };
  } catch {
    return json(500, { error: 'authorization_lookup_failed' });
  }
}
