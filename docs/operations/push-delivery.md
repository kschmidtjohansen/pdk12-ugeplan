# PolyPlan v1.4 — push delivery

## Delivery contract
Inbox creation, push-provider acceptance and OS display are different outcomes. `sent` means at least one provider accepted a push, not that a phone displayed it. Realtime only updates an open app; closed-app notification display requires server push and the dedicated `public/push-sw.js` worker. The messaging worker is not an offline app-shell cache.

## Implemented client safeguards
- Rotation reads only `resubscribe:<oldEndpoint>` in IndexedDB `polyplan-push/kv`; no arbitrary latest-token fallback. Only HTTP success with `updated: true` commits new token/latest and old-key removal in one transaction, retaining the account owner.
- Missing token, rejected HTTP response or IDB failure requires app-open recovery. Server and browser storage cannot form one distributed transaction; authenticated refresh re-saves the current subscription.
- `on` requires authenticated Supabase persistence plus local recovery storage, not just a browser PushSubscription. Permission/platform errors and database rejection do not show enabled.
- Per-account opt-out, endpoint owner switching, serialized persistence, sign-out cleanup and generation checks protect device lifecycle. Multiple devices keep separate endpoint rows.
- Initial inbox fetch, account isolation, debounced realtime catch-up, focus/online/visibility refresh and five-minute visible-tab reconciliation recover missed events. Full history is paginated in 500-row batches to derive exact unread counts; high-volume inboxes should later use an exact-count query and bounded recent window.
- Read/delete operations include user ID, retain local state on failure and invalidate the same user's drawer pages. Payload navigation accepts only internal app links.
- Test-push UI is restricted to non-demo administrator/super_admin; server validation remains authoritative.

## Read-only server audit — 2026-10-25
Confirmed in the external database: enabled `notify_push_on_notification_trg`, `notify_push_on_notification` with empty search_path, installed pg_net, notifications in Realtime publication, configured push URL matching send-push and configured trigger credential. Trigger uses `x-push-trigger-secret` and skips demo rows. No INSERT/UPDATE/DELETE QA was run.

Project secret names `PUSH_TRIGGER_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` are present. Values, key pairing and deployment to the external Edge environment were not inspected. No secret was exposed and no real push was sent.

### Outstanding server checks / changes (not deployed)
1. Verify deployed send-push gateway JWT settings. Repository config has no explicit send-push entry. Database-trigger requests use a shared secret rather than a user JWT: gateway verification must allow this request while the handler MUST still validate PUSH_TRIGGER_SECRET. Never create an unauthenticated public send endpoint. This repository omission alone does not prove deployed settings are wrong.
2. Compare the database trigger credential with the external Edge PUSH_TRIGGER_SECRET through secure operational configuration, never logs or browser code. Check VAPID public/private pair and compare the public key used by the app/worker with the deployed pair. Re-register affected endpoints after any key rotation.
3. Fix send-push preference lookup fail-open on database error: confirmed missing preference may use the default, but a lookup error must not silently bypass opt-out. Existing code removes stale 404/410 endpoints and records failures; retries are not a durable automatic queue.
4. Add bounded retry/backoff and concurrency-safe idempotency for notification IDs. Broadcast retry presently counts acceptance but lacks a durable retry cap/claim; provider-accepted pushes must not be resent automatically. Preserve recipient RLS and privileged credential handling.
5. Inspect pg_net response status, send-push logs and notification push_status/attempts/error metadata after an authorized controlled test. Pending forever suggests gateway/trigger/network configuration; failed may indicate VAPID mismatch or provider errors; no_subscription and skipped are distinct non-failure outcomes.

Edge/config/migrations were intentionally not edited because this project automatically deploys Edge changes and v1.4 expressly forbids deployment. Server remediation is therefore outstanding, not claimed fixed.

## Physical-device acceptance (not performed)
Use a dedicated authorized test account/device, never unsuspecting employees. Obtain explicit approval before sending.
- iOS 16.4+: install via Add to Home Screen, launch that installed app, sign in and grant permission there. Browser-only iOS is not sufficient.
- Android: grant notification permission, check app/browser OS notification settings and battery restrictions. Installation is recommended, not a universal web-push requirement.
- Enable and verify database endpoint persistence; close the app, send one controlled test, inspect OS display, then tap and confirm the internal destination after authentication.
- Repeat with denied permission, offline/reconnect, sign-out/sign-in/account switch, two devices and endpoint rotation. Verify no previous-account display and other-device subscriptions remain untouched.
- Confirm read/delete catches up on reopen and disabled/preferences prevent subsequent pushes. Provider acceptance is not a guarantee: OS focus modes, network, user settings and battery policies may suppress or delay display.

## QA evidence
125 tests passed, including VM execution of the actual worker with HTTP/IDB mocks, account-scoped inbox/reconnect tests and authenticated subscription-status tests. Dashboard fixtures checked at 360/390/768/1280 in light/dark: different info/warning/success backgrounds, accent borders, 16px gaps and no horizontal overflow; keyboard KPI focus checked. These are controlled fixtures, not authenticated live screenshots. No authenticated E2E or physical phone delivery was verified (external unmanaged Supabase). Manual build/typecheck were not run: preview harness reported build OK.

## Scope
No publication, Edge deployment, migrations, production data modification or real test pushes. Employees/Cars/Vacation module finish (priority C) deferred in favour of A+B. Closed-app end-to-end reliability remains unverified pending the server and device checks above.