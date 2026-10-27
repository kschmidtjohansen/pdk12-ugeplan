# STAGED patch for supabase/functions/send-push/index.ts (not applied)

Copy `_shared/policies.ts` next to the function, then apply these three changes.

## 1. Preference lookup fails closed (privacy)

```ts
import { decidePushPreference, safeSecretEquals } from '../_shared/policies.ts';

async function userPreference(userId: string, category: PrefColumn) {
  const { data, error } = await admin.from('notification_preferences')
    .select(category).eq('user_id', userId).maybeSingle();
  return decidePushPreference(data as Record<string, unknown> | null, error, category);
}
```

In the trigger branch, replace the `userAllowsCategory` block with:

```ts
const pref = await userPreference(notification.user_id, categoryForType(notification.type));
if (pref === 'deny') { await recordDelivery(notification.id, campaignId, 'skipped', attempts, null); return ok({ skipped: true, reason: 'preference-off' }); }
if (pref === 'unknown') {
  // Do NOT send when the preference is unknown. Mark deferred so a later run can retry.
  await recordDelivery(notification.id, campaignId, 'deferred', attempts, 'preference_lookup_failed');
  return new Response(JSON.stringify({ deferred: true }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
```

## 2. Idempotent claim before sending (no double push on trigger retry)

```ts
const { data: claimed, error: claimErr } = await admin.from('notifications')
  .update({ push_status: 'sending', push_updated_at: new Date().toISOString() })
  .eq('id', notification.id)
  .in('push_status', ['pending', 'failed', 'deferred'])
  .select('id');
if (claimErr) throw claimErr;
if (!claimed || claimed.length === 0) return ok({ skipped: true, reason: 'already-processed' });
```

## 3. recordDelivery reports errors

```ts
async function recordDelivery(...): Promise<void> {
  const { error } = await admin.from('notifications').update({...}).eq('id', notificationId);
  if (error) throw new Error(`record_delivery_failed:${error.code}`);
  if (campaignId) {
    const { error: e2 } = await admin.rpc('recalc_broadcast_stats', { p_campaign_id: campaignId });
    if (e2) throw new Error(`recalc_failed:${e2.code}`);
  }
}
```

## 4. Constant-time trigger secret

```ts
if (triggerSecret !== null) {
  if (!safeSecretEquals(TRIGGER_SECRET, triggerSecret)) return unauthorized();
```

## 5. config.toml

Add an explicit section (function validates the secret / JWT itself):

```toml
[functions.send-push]
verify_jwt = false
```

New push_status values: `sending`, `deferred` (column is free text, no CHECK constraint
found in migrations). Admin diagnostics UI should treat unknown values as "afventer".
