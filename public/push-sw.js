// Dedicated messaging service worker for web push notifications.
// It does NOT cache anything and is independent of the app-shell cleanup worker.

const VAPID_PUBLIC_KEY =
  'BKKmMLcowtNDuG9bFN9eC7T7BunqymROog_FBSqoY3mNOmmgkJJVMl-z2Wy55gwTBnUTxol6j8p9SdpL1wTUAps';
const RESUBSCRIBE_URL =
  'https://cyuyrpwtkljfiqwgasmn.supabase.co/functions/v1/push-resubscribe';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = self.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_err) {
    payload = { title: 'Polygon Ugeplan', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Polygon Ugeplan';
  const options = {
    body: payload.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'polygon-notification',
    renotify: true,
    data: { link: payload.link || '/dashboard' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// The browser can rotate the push endpoint at any time. When that happens we
// re-subscribe silently and hand the new endpoint to the backend, so the user
// never has to enable notifications again.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const oldEndpoint = event.oldSubscription?.endpoint || null;
      try {
        const subscription =
          event.newSubscription ||
          (await self.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          }));

        const json = subscription.toJSON();
        await fetch(RESUBSCRIBE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            old_endpoint: oldEndpoint,
            endpoint: subscription.endpoint,
            p256dh: json.keys && json.keys.p256dh,
            auth: json.keys && json.keys.auth,
          }),
        });
      } catch (_err) {
        /* the app re-checks and re-subscribes on next launch */
      }
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/dashboard';
  const targetUrl = new URL(link, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(targetUrl);
            } catch (_err) {
              /* ignore */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
