import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@pdk12.dk';
const TRIGGER_SECRET = Deno.env.get('PUSH_TRIGGER_SECRET') ?? '';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface PushPayload {
  title: string;
  body: string;
  link?: string | null;
  tag?: string;
}

type PrefColumn = 'broadcast' | 'assignment' | 'duty' | 'vacation' | 'sick_day';

function categoryForType(type: string): PrefColumn {
  if (type === 'broadcast') return 'broadcast';
  if (type === 'duty') return 'duty';
  if (type === 'vacation') return 'vacation';
  if (type === 'sick_day') return 'sick_day';
  return 'assignment';
}

// Preferences default to enabled: a missing row means the user wants everything.
async function userAllowsCategory(userId: string, category: PrefColumn) {
  const { data, error } = await admin
    .from('notification_preferences')
    .select(category)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return true;
  const value = (data as Record<string, unknown>)[category];
  return value !== false;
}

async function sendToUser(userId: string, payload: PushPayload) {
  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (error) throw error;
  if (!subs || subs.length === 0) {
    return { sent: 0, removed: 0, failed: 0, hadSubscription: false, lastError: null as string | null };
  }

  let sent = 0;
  let removed = 0;
  let failed = 0;
  let lastError: string | null = null;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
        { TTL: 3600 },
      );
      sent++;
    } catch (err) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      const message = (err as { message?: string })?.message ?? 'unknown error';
      failed++;
      lastError = `${statusCode ?? ''} ${message}`.trim().slice(0, 500);
      if (statusCode === 404 || statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', sub.id);
        removed++;
      } else {
        await admin
          .from('push_subscriptions')
          .update({ last_error: `${statusCode ?? ''} ${message}`.trim().slice(0, 500) })
          .eq('id', sub.id);
      }
    }
  }

  return { sent, removed, failed, hadSubscription: true, lastError };
}

type DeliveryStatus = 'sent' | 'failed' | 'skipped' | 'no_subscription';

/**
 * Stores the delivery outcome on the notification row and recomputes the
 * campaign counters, so retries never double-count a recipient.
 */
async function recordDelivery(
  notificationId: string,
  campaignId: string | null,
  status: DeliveryStatus,
  attempts: number,
  lastError: string | null,
) {
  await admin
    .from('notifications')
    .update({
      push_status: status,
      push_attempts: attempts + 1,
      push_last_error: lastError,
      push_updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (campaignId) {
    await admin.rpc('recalc_broadcast_stats', { p_campaign_id: campaignId });
  }
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const triggerSecret = req.headers.get('x-push-trigger-secret');

    // 1) Internal call from the database trigger
    if (triggerSecret) {
      if (!TRIGGER_SECRET || triggerSecret !== TRIGGER_SECRET) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const notificationId = String(body?.notification_id ?? '');
      if (!notificationId) {
        return new Response(JSON.stringify({ error: 'notification_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: notification, error } = await admin
        .from('notifications')
        .select('id, user_id, title, message, link, type, is_demo, broadcast_id')
        .eq('id', notificationId)
        .maybeSingle();

      if (error) throw error;
      if (!notification || notification.is_demo) {
        return new Response(JSON.stringify({ skipped: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const campaignId: string | null = notification.broadcast_id ?? null;

      const allowed = await userAllowsCategory(
        notification.user_id,
        categoryForType(notification.type),
      );
      if (!allowed) {
        if (campaignId) await recordBroadcastOutcome(campaignId, { skipped: 1 });
        return new Response(JSON.stringify({ skipped: true, reason: 'preference-off' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await sendToUser(notification.user_id, {
        title: notification.title,
        body: notification.message,
        link: notification.link,
        tag: `${notification.type}-${notification.id}`,
      });

      if (campaignId) {
        await recordBroadcastOutcome(campaignId, {
          // One recipient counts as reached when at least one device accepted it.
          sent: result.sent > 0 ? 1 : 0,
          failed: result.sent === 0 && result.failed > 0 ? 1 : 0,
          noSub: result.hadSubscription ? 0 : 1,
        });
      }

      return new Response(JSON.stringify({ ok: true, ...result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    }

    // 2) Authenticated self-test from the app
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await sendToUser(userData.user.id, {
      title: typeof body?.title === 'string' ? body.title.slice(0, 120) : 'Test-notifikation',
      body:
        typeof body?.body === 'string'
          ? body.body.slice(0, 300)
          : 'Push-notifikationer virker på denne enhed.',
      link: '/dashboard',
      tag: 'push-test',
    });

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = (err as { message?: string })?.message ?? 'unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
