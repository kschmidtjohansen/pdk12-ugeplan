// STAGED — not deployed. Replaces supabase/functions/swap-duties/index.ts
// Requires staged SQL: swap_or_transfer_duty (all rules + row locks in one transaction).
// No manual fallback, no manual rollback.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { json, serviceClient } from '../_shared/caller.ts';
import { isUuid } from '../_shared/policies.ts';

const ERR_MAP: Record<string, number> = { '42501': 403, P0002: 404, '22023': 400, '40001': 409, '55P03': 409 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  try {
    const auth = req.headers.get('Authorization') ?? '';
    if (!auth.startsWith('Bearer ')) return json(401, { error: 'unauthorized' });
    // User-scoped client: the RPC evaluates auth.uid() itself.
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: auth } }, auth: { persistSession: false },
    });
    const { data: u, error: uErr } = await userClient.auth.getUser();
    if (uErr || !u?.user) return json(401, { error: 'unauthorized' });

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const duty1Id = body?.duty1Id, duty2Id = body?.duty2Id;
    if (!isUuid(duty1Id) || !isUuid(duty2Id) || duty1Id === duty2Id) return json(400, { error: 'invalid_duties' });

    const { data: result, error } = await userClient.rpc('swap_or_transfer_duty', { p_duty1: duty1Id, p_duty2: duty2Id });
    if (error) {
      const status = ERR_MAP[error.code ?? ''] ?? 500;
      return json(status, { error: status === 500 ? 'swap_failed' : error.message });
    }

    // Notifications are best-effort AFTER the committed swap; failures are reported, not hidden.
    const r = result as { is_transfer: boolean; duty_type: string; d1_date: string; d2_date: string;
      e1: string | null; e2: string | null; e1_name: string | null; e2_name: string | null };
    const label = r.duty_type === 'skadeleder_vagt' ? 'Skadeleder vagt' : 'Kørevagt';
    const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const rows = r.is_transfer
      ? [{ user_id: (r.e1 ?? r.e2)!, type: 'duty', title: 'Vagt flyttet', link: '/duty', read: false,
          message: `Din ${label} er flyttet fra ${fmt(r.e1 ? r.d2_date : r.d1_date)} til ${fmt(r.e1 ? r.d1_date : r.d2_date)}` }]
      : [
          { user_id: r.e1!, type: 'duty', title: 'Vagt byttet', link: '/duty', read: false,
            message: `Din ${label} på ${fmt(r.d2_date)} er byttet med ${r.e2_name ?? 'en kollega'} - du har nu vagt den ${fmt(r.d1_date)}` },
          { user_id: r.e2!, type: 'duty', title: 'Vagt byttet', link: '/duty', read: false,
            message: `Din ${label} på ${fmt(r.d1_date)} er byttet med ${r.e1_name ?? 'en kollega'} - du har nu vagt den ${fmt(r.d2_date)}` },
        ];
    const { error: nErr } = await serviceClient().from('notifications').insert(rows);
    return json(200, { success: true, notificationsSent: !nErr });
  } catch (err) {
    console.error('[swap-duties] error', (err as { message?: string })?.message);
    return json(500, { error: 'internal_error' });
  }
});
