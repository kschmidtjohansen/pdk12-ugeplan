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
// It can only move an existing subscription row to its new endpoint - it never
// creates a subscription, so an unknown old endpoint is a no-op.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const oldEndpoint = typeof body?.old_endpoint === 'string' ? body.old_endpoint : '';
    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
    const p256dh = typeof body?.p256dh === 'string' ? body.p256dh : '';
    const auth = typeof body?.auth === 'string' ? body.auth : '';

    if (!oldEndpoint || !endpoint || !p256dh || !auth) {
      return json({ error: 'invalid payload' }, 400);
    }
    if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000) {
      return json({ error: 'invalid endpoint' }, 400);
    }

    const { data: existing, error: lookupError } = await admin
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', oldEndpoint)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!existing) return json({ updated: false });

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
