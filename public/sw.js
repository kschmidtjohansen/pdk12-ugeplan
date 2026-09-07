// One-release kill switch for the former Workbox app-shell service worker.
// It removes only caches owned by that worker, then unregisters itself.
const APP_CACHE_NAMES = new Set(['html-cache', 'supabase-api', 'static-assets']);

function isFormerAppCache(name) {
  const isNamedAppCache = APP_CACHE_NAMES.has(name);
  const isScopedWorkboxCache =
    /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name) &&
    name.endsWith(self.registration.scope);

  return isNamedAppCache || isScopedWorkboxCache;
}

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const appCacheNames = cacheNames.filter(isFormerAppCache);
        await Promise.allSettled(appCacheNames.map((name) => caches.delete(name)));
        await self.clients.claim();

        const windowClients = await self.clients.matchAll({ type: 'window' });
        await Promise.allSettled(
          windowClients.map((client) => client.navigate(client.url)),
        );
      } finally {
        await self.registration.unregister();
      }
    })(),
  );
});