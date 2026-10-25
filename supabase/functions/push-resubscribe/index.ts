import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Called by the push service worker when the browser rotates the push endpoint.
//
// Authorization model (fail-closed): every subscription row carries a random
// `resubscribe_token` that is issued only to the signed-in owner's browser and
// stored in IndexedDB, where the push service worker can read it. Rotating a
// subscription requires knowing BOTH the old endpoint AND its token, so an
// unauthenticated caller can no longer overwrite another device's keys.
// Rows without a token (created before this change) cannot be rotated here;
// the app re-saves the subscription on next launch, which issues a token.
// Unknown endpoints remain a no-op, and the function never creates rows.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const oldEndpoint = typeof body?.old_endpoint === 'string' ? body.old_endpoint : '';
    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
    const p256dh = typeof body?.p256dh === 'string' ? body.p256dh : '';
    const auth = typeof body?.auth === 'string' ? body.auth : '';
    const token = typeof body?.resubscribe_token === 'string' ? body.resubscribe_token : '';

    if (!oldEndpoint || !endpoint || !p256dh || !auth) {
      return json({ error: 'invalid payload' }, 400);
    }
    if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000) {
      return json({ error: 'invalid endpoint' }, 400);
    }
    if (!token || token.length > 200) {
      return json({ error: 'forbidden' }, 403);
    }

    const { data: existing, error: lookupError } = await admin
      .from('push_subscriptions')
      .select('id, resubscribe_token')
      .eq('endpoint', oldEndpoint)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!existing) return json({ updated: false });

    if (!existing.resubscribe_token || existing.resubscribe_token !== token) {
      return json({ error: 'forbidden' }, 403);
    }

    const { error: updateError } = await admin
      .from('push_subscriptions')
      .update({
        endpoint,
        p256dh,
        auth,
        last_seen_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', existing.id);

    if (updateError) throw updateError;

    return json({ updated: true });
  } catch (_err) {
    return json({ error: 'internal error' }, 500);
  }
});
