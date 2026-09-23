import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';


const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const ALLOWED_ROLES = [
  'administrator',
  'skadeleder',
  'servicemedarbejder',
  'vikar',
  'fugttekniker',
  'super_admin',
];

async function getRoles(userId: string) {
  const { data } = await admin.from('user_roles').select('role').eq('user_id', userId);
  return (data ?? []).map((r) => r.role as string);
}

/** Internal URL + shared secret used to invoke the push service directly. */
async function getPushConfig() {
  const { data } = await admin
    .from('app_internal_config')
    .select('key, value')
    .in('key', ['push_trigger_secret', 'push_function_url']);

  const map = new Map((data ?? []).map((r) => [r.key as string, r.value as string]));
  const url = map.get('push_function_url');
  const secret = map.get('push_trigger_secret');
  if (!url || !secret) {
    console.error('resend: push configuration missing');
    return null;
  }
  return { url, secret };
}

async function getAccessibleDepartments(userId: string) {
  const [{ data: profile }, { data: access }] = await Promise.all([
    admin.from('profiles').select('home_department_id').eq('id', userId).maybeSingle(),
    admin.from('user_access').select('department_id').eq('user_id', userId),
  ]);
  const ids = new Set<string>();
  if (profile?.home_department_id) ids.add(profile.home_department_id);
  for (const row of access ?? []) if (row.department_id) ids.add(row.department_id);
  return ids;
}

/** Demo login accounts are never real employees and must never be notified. */
const DEMO_EMAILS = new Set(['test@polygongroup.com']);



/** Shared recipient resolution so preview and send can never drift apart. */
async function resolveRecipients(
  departmentId: string | null,
  targetRoles: string[],
  _actorId: string,
  userIds: string[] = [],
) {
  const recipients = new Set<string>();

  if (departmentId) {
    const [{ data: byHome }, { data: byAccess }] = await Promise.all([
      admin.from('profiles').select('id').eq('home_department_id', departmentId).eq('is_demo', false),
      admin.from('user_access').select('user_id').eq('department_id', departmentId),
    ]);
    for (const row of byHome ?? []) recipients.add(row.id);
    for (const row of byAccess ?? []) recipients.add(row.user_id);
  } else {
    const { data: all } = await admin.from('profiles').select('id').eq('is_demo', false);
    for (const row of all ?? []) recipients.add(row.id);
  }

  if (targetRoles.length > 0) {
    const { data: roleRows } = await admin
      .from('user_roles')
      .select('user_id')
      .in('role', targetRoles);
    const allowed = new Set((roleRows ?? []).map((r) => r.user_id));
    for (const id of [...recipients]) if (!allowed.has(id)) recipients.delete(id);
  }

  // Demo accounts and temporary staff (vikarer) must never receive notifications.
  if (recipients.size > 0) {
    const ids = [...recipients];
    const [{ data: profileRows }, { data: tempRoleRows }] = await Promise.all([
      admin.from('profiles').select('id, email, is_demo, is_temporary').in('id', ids),
      admin.from('user_roles').select('user_id').eq('role', 'vikar').in('user_id', ids),
    ]);
    const keep = new Set(
      (profileRows ?? [])
        .filter((p) => !p.is_demo && !p.is_temporary && !DEMO_EMAILS.has((p.email ?? '').toLowerCase()))
        .map((p) => p.id),
    );

    for (const row of tempRoleRows ?? []) keep.delete(row.user_id);
    for (const id of ids) if (!keep.has(id)) recipients.delete(id);
  }

  // Named individuals: only people already inside the resolved audience may be
  // picked, so department and role access rules still apply.
  if (userIds.length > 0) {
    const picked = new Set(userIds);
    for (const id of [...recipients]) if (!picked.has(id)) recipients.delete(id);
  }

  // The sender stays in the list when they belong to the audience, so admins
  // receive their own department messages like everyone else.
  return recipients;
}

function parseTargetRoles(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((r: unknown) => typeof r === 'string' && ALLOWED_ROLES.includes(r))
    : [];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUserIds(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v: unknown) => typeof v === 'string' && UUID_RE.test(v)).slice(0, 500)
    : [];
}




async function generateNotification(rawText: string, audience: string) {
  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) {
    console.error('generate: LOVABLE_API_KEY is not configured');
    return { error: 'missing_api_key', status: 500 as const };
  }

  const systemPrompt = [
    'Du skriver korte push-notifikationer på professionelt dansk til medarbejdere i en skadeservicevirksomhed.',
    'Svar ALTID præcist i dette format og intet andet:',
    'TITEL: <maks 45 tegn>',
    'BESKED: <maks 130 tegn>',
    'Vær konkret, venlig og handlingsorienteret. Ingen emojis. Ingen indledning eller forklaring.',
  ].join('\n');

  console.log('generate: calling AI gateway');

  let res: Response;
  try {
    res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': key,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        reasoning_effort: 'low',
        max_completion_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Modtagere: ${audience}\n\nRåtekst fra administrator:\n${rawText}`,
          },
        ],
      }),
    });
  } catch (err) {
    console.error('generate: network error calling AI gateway', (err as Error)?.message);
    return { error: 'gateway_unreachable', status: 502 as const };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('generate: AI gateway returned', res.status, detail.slice(0, 500));
    if (res.status === 429) return { error: 'rate_limited', status: 429 as const };
    if (res.status === 402) return { error: 'payment_required', status: 402 as const };
    return { error: 'gateway_error', status: 502 as const };
  }

  let text = '';
  try {
    const payload = await res.json();
    text = String(payload?.choices?.[0]?.message?.content ?? '');
  } catch (err) {
    console.error('generate: could not read AI response', (err as Error)?.message);
    return { error: 'empty_result', status: 502 as const };
  }

  const titleMatch = text.match(/TITEL:\s*(.+)/i);
  const bodyMatch = text.match(/BESKED:\s*([\s\S]+)/i);

  const title = (titleMatch?.[1] ?? 'Vigtig besked').trim().slice(0, 60);
  const message = (bodyMatch?.[1] ?? text).trim().replace(/\s+/g, ' ').slice(0, 200);

  if (!message) {
    console.error('generate: model returned empty text');
    return { error: 'empty_result', status: 502 as const };
  }

  console.log('generate: success');
  return { title, message };
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
    if (!token) return json({ error: 'unauthorized' }, 401);

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) return json({ error: 'unauthorized' }, 401);
    const actor = userData.user;

    const roles = await getRoles(actor.id);
    const isSuperAdmin = roles.includes('super_admin');
    const isAdmin = isSuperAdmin || roles.includes('administrator');
    if (!isAdmin) return json({ error: 'forbidden' }, 403);

    const body = await req.json().catch(() => ({}));
    const mode = String(body?.mode ?? '');

    if (mode === 'generate') {
      const rawText = String(body?.text ?? '').trim();
      if (rawText.length < 3 || rawText.length > 4000) {
        return json({ error: 'invalid_text' }, 400);
      }
      const audience = String(body?.audience ?? 'alle medarbejdere').slice(0, 200);
      const generated = await generateNotification(rawText, audience);
      if ('error' in generated) return json({ error: generated.error }, generated.status);
      return json(generated);
    }

    if (mode === 'preview_recipients' || mode === 'list_recipients') {
      const departmentId = body?.departmentId ? String(body.departmentId) : null;
      const targetRoles = parseTargetRoles(body?.roles);
      const userIds = mode === 'preview_recipients' ? parseUserIds(body?.userIds) : [];

      if (!isSuperAdmin) {
        const accessible = await getAccessibleDepartments(actor.id);
        if (!departmentId || !accessible.has(departmentId)) {
          return json({ error: 'forbidden_department' }, 403);
        }
      }

      const recipients = await resolveRecipients(departmentId, targetRoles, actor.id, userIds);

      if (mode === 'list_recipients') {
        const ids = [...recipients];
        if (ids.length === 0) return json({ ok: true, people: [] });
        const { data: people } = await admin
          .from('profiles')
          .select('id, name, email')
          .in('id', ids)
          .order('name');
        return json({ ok: true, people: people ?? [] });
      }

      return json({ ok: true, count: recipients.size });
    }

    if (mode === 'send') {
      const title = String(body?.title ?? '').trim().slice(0, 120);
      const message = String(body?.message ?? '').trim().slice(0, 500);
      const link = body?.link ? String(body.link).slice(0, 200) : null;
      const departmentId = body?.departmentId ? String(body.departmentId) : null;
      const targetRoles = parseTargetRoles(body?.roles);
      const userIds = parseUserIds(body?.userIds);

      if (!title || !message) return json({ error: 'invalid_content' }, 400);

      if (!isSuperAdmin) {
        const accessible = await getAccessibleDepartments(actor.id);
        if (!departmentId || !accessible.has(departmentId)) {
          return json({ error: 'forbidden_department' }, 403);
        }
      }

      const recipients = await resolveRecipients(departmentId, targetRoles, actor.id, userIds);


      if (recipients.size === 0) return json({ ok: true, recipients: 0 });

      const { data: actorProfile } = await admin
        .from('profiles')
        .select('name')
        .eq('id', actor.id)
        .maybeSingle();

      const { data: campaign, error: campaignError } = await admin
        .from('broadcast_campaigns')
        .insert({
          created_by: actor.id,
          created_by_name: actorProfile?.name ?? actor.email ?? '',
          department_id: departmentId,
          roles: targetRoles,
          title,
          message,
          link,
          total_recipients: recipients.size,
        })
        .select('id')
        .single();

      if (campaignError) throw campaignError;

      const rows = [...recipients].map((userId) => ({
        user_id: userId,
        type: 'broadcast',
        title,
        message,
        link,
        broadcast_id: campaign.id,
      }));

      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await admin.from('notifications').insert(rows.slice(i, i + 200));
        if (error) throw error;
      }

      return json({ ok: true, recipients: rows.length, campaignId: campaign.id });

    }

    if (mode === 'resend_failed') {
      const campaignId = String(body?.campaignId ?? '');
      if (!campaignId) return json({ error: 'invalid_content' }, 400);

      const { data: campaign } = await admin
        .from('broadcast_campaigns')
        .select('id, department_id')
        .eq('id', campaignId)
        .maybeSingle();

      if (!campaign) return json({ error: 'not_found' }, 404);

      if (!isSuperAdmin) {
        const accessible = await getAccessibleDepartments(actor.id);
        if (!campaign.department_id || !accessible.has(campaign.department_id)) {
          return json({ error: 'forbidden_department' }, 403);
        }
      }

      const { data: failedRows, error: failedError } = await admin
        .from('notifications')
        .select('id')
        .eq('broadcast_id', campaignId)
        .eq('push_status', 'failed');

      if (failedError) throw failedError;
      if (!failedRows || failedRows.length === 0) {
        return json({ error: 'nothing_to_resend' }, 400);
      }

      const pushConfig = await getPushConfig();
      if (!pushConfig) return json({ error: 'push_not_configured' }, 500);

      let sent = 0;
      for (let i = 0; i < failedRows.length; i += 10) {
        const chunk = failedRows.slice(i, i + 10);
        const results = await Promise.all(
          chunk.map(async (row) => {
            try {
              const res = await fetch(pushConfig.url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-push-trigger-secret': pushConfig.secret,
                },
                body: JSON.stringify({ notification_id: row.id }),
              });
              const payload = await res.json().catch(() => ({}));
              return res.ok && (payload?.sent ?? 0) > 0;
            } catch (err) {
              console.error('resend: push call failed', (err as Error)?.message);
              return false;
            }
          }),
        );
        sent += results.filter(Boolean).length;
      }

      await admin.rpc('recalc_broadcast_stats', { p_campaign_id: campaignId });

      return json({
        ok: true,
        retried: failedRows.length,
        sent,
        stillFailed: failedRows.length - sent,
      });
    }

    return json({ error: 'invalid_mode' }, 400);
  } catch (err) {
    const message = (err as { message?: string })?.message ?? 'unknown error';
    return json({ error: message }, 500);
  }
});
