/**
 * Clears offline/browser caches whenever a new build is deployed.
 *
 * A build stamp is injected at build time (see vite.config.ts). When the stamp
 * stored in this browser differs from the running build, we drop:
 *  - all Cache Storage buckets owned by the app shell worker
 *  - the app-shell service worker registration (/sw.js) — the push worker
 *    (/push-sw.js) is deliberately left alone so notifications keep working
 *  - the local "kældertilstand" offline snapshots
 *
 * Auth storage is intentionally untouched: nobody gets logged out.
 */

const STAMP_KEY = 'polyplan_build_id';
const PUSH_SW_PATH = '/push-sw.js';

declare const __APP_BUILD_ID__: string;

const currentBuildId =
  typeof __APP_BUILD_ID__ === 'string' ? __APP_BUILD_ID__ : 'dev';

function clearOfflineSnapshots(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('polyplan_offline_today_')) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* storage unavailable — nothing to clear */
  }
}

async function clearBrowserCaches(): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const names = await caches.keys();
    await Promise.allSettled(names.map((name) => caches.delete(name)));
  } catch {
    /* ignore */
  }
}

async function unregisterAppShellWorkers(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((reg) => {
          const url =
            reg.active?.scriptURL ||
            reg.waiting?.scriptURL ||
            reg.installing?.scriptURL ||
            '';
          return !url.endsWith(PUSH_SW_PATH);
        })
        .map((reg) => reg.unregister()),
    );
  } catch {
    /* ignore */
  }
}

export async function resetCachesOnNewBuild(): Promise<void> {
  let storedBuildId: string | null = null;
  try {
    storedBuildId = localStorage.getItem(STAMP_KEY);
  } catch {
    return;
  }

  if (storedBuildId === currentBuildId) return;

  // Persist first so a failure mid-cleanup cannot cause a reload loop.
  try {
    localStorage.setItem(STAMP_KEY, currentBuildId);
  } catch {
    /* ignore */
  }

  clearOfflineSnapshots();
  await clearBrowserCaches();
  await unregisterAppShellWorkers();

  if (import.meta.env.DEV) {
    console.info('[appVersionReset] Offline cache cleared for build', currentBuildId);
  }
}
