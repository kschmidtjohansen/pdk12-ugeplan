import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/context/TranslationContext';

export const VAPID_PUBLIC_KEY =
  'BKKmMLcowtNDuG9bFN9eC7T7BunqymROog_FBSqoY3mNOmmgkJJVMl-z2Wy55gwTBnUTxol6j8p9SdpL1wTUAps';

const PUSH_SW_URL = '/push-sw.js';

const isPreviewContext = () => {
  if (typeof window === 'undefined') return true;
  const { hostname } = window.location;
  const inIframe = window.self !== window.top;
  return (
    inIframe ||
    hostname.startsWith('id-preview--') ||
    hostname.startsWith('preview--') ||
    hostname === 'lovableproject.com' ||
    hostname.endsWith('.lovableproject.com') ||
    hostname === 'lovableproject-dev.com' ||
    hostname.endsWith('.lovableproject-dev.com') ||
    hostname === 'beta.lovable.dev' ||
    hostname.endsWith('.beta.lovable.dev')
  );
};

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
};

const detectIos = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
};

export type PushBrowser = 'edge' | 'chrome' | 'safari' | 'firefox' | 'other';

const detectBrowser = (): PushBrowser => {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/Edg(A|iOS|)\//i.test(ua)) return 'edge';
  if (/CriOS|Chrome\//i.test(ua)) return 'chrome';
  if (/FxiOS|Firefox\//i.test(ua)) return 'firefox';
  if (/Safari\//i.test(ua)) return 'safari';
  return 'other';
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer | null) => {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

export type PushStatus = 'unsupported' | 'needs-install' | 'blocked' | 'off' | 'on' | 'error';

// The resubscribe token proves this browser owns the subscription row when the
// push service worker later needs to rotate the endpoint. It is stored in
// IndexedDB so the service worker (which cannot read localStorage) can reach it.
const IDB_NAME = 'polyplan-push';
const IDB_STORE = 'kv';

const idbOpen = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

// A single transaction keeps the worker token and endpoint pointer consistent.
const writeDevice = async (endpoint: string, token: string, userId: string): Promise<void> => {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(token, `resubscribe:${endpoint}`);
    store.put({ endpoint, token, userId }, 'latest');
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error); };
  });
};
const readDeviceOwner = async (): Promise<string | null> => {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get('latest');
    req.onsuccess = () => resolve(typeof req.result?.userId === 'string' ? req.result.userId : null);
    tx.oncomplete = () => db.close();
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error); };
  });
};
const clearDevice = async () => {
  const db = await idbOpen();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error); };
  });
};

export const saveSubscription = async (subscription: PushSubscription, expectedUserId?: string) => {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (authError || !userId || (expectedUserId && userId !== expectedUserId)) return false;
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh ?? arrayBufferToBase64(subscription.getKey('p256dh'));
  const auth = json.keys?.auth ?? arrayBufferToBase64(subscription.getKey('auth'));
  if (!p256dh || !auth) return false;
  const { data: existing, error: lookupError } = await supabase.from('push_subscriptions')
    .select('user_id, resubscribe_token').eq('endpoint', subscription.endpoint).eq('user_id', userId).maybeSingle();
  if (lookupError) return false;
  const resubscribeToken = existing?.resubscribe_token || crypto.randomUUID();
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: userId, endpoint: subscription.endpoint, p256dh, auth,
    resubscribe_token: resubscribeToken, user_agent: navigator.userAgent.slice(0, 300),
    last_seen_at: new Date().toISOString(), last_error: null,
  }, { onConflict: 'endpoint' });
  if (error) return false;
  try { await writeDevice(subscription.endpoint, resubscribeToken, userId); }
  catch { return false; } // recovery is required before claiming the device is ready
  return true;
};

// Several screens use this hook: serialize registration/persistence per browser.
let subscriptionWork: Promise<boolean> | null = null;
let deviceOwner: string | null = null;
const persistDevice = (expectedUserId: string): Promise<boolean> => {
  if (subscriptionWork) return subscriptionWork.then(() => persistDevice(expectedUserId));
  subscriptionWork = (async () => {
    const registration = (await navigator.serviceWorker.getRegistration(PUSH_SW_URL)) ??
      await navigator.serviceWorker.register(PUSH_SW_URL, { scope: '/' });
    if (!registration.active) await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    const storedOwner = deviceOwner || await readDeviceOwner();
    if (storedOwner && storedOwner !== expectedUserId) {
      await clearDevice();
      if (subscription) await subscription.unsubscribe();
      subscription = null;
    }
    deviceOwner = expectedUserId;
    if (!subscription) subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const saved = await saveSubscription(subscription, expectedUserId);
    // Another account may have signed in while persistence was in flight.
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id !== expectedUserId) return false;
    return saved;
  })().catch(() => false).finally(() => { subscriptionWork = null; });
  return subscriptionWork;
};

export const usePushNotifications = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<PushStatus>('unsupported');
  const [busy, setBusy] = useState(false);
  const isIos = detectIos();
  const browser = detectBrowser();
  const [installed, setInstalled] = useState(isStandalone);

  const hasPushApis =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !isPreviewContext();

  // iOS requires Home Screen installation; other browsers may support web push.
  const supported = hasPushApis && (!isIos || installed);
  const generation = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(display-mode: standalone)');
    const onChange = () => setInstalled(isStandalone());
    media.addEventListener?.('change', onChange);
    window.addEventListener('appinstalled', onChange);
    return () => {
      media.removeEventListener?.('change', onChange);
      window.removeEventListener('appinstalled', onChange);
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
    const version = ++generation.current;
    if (!hasPushApis) { setStatus('unsupported'); return; }
    if (isIos && !installed) { setStatus('needs-install'); return; }
    if (Notification.permission === 'denied') { setStatus('blocked'); return; }
    if (Notification.permission !== 'granted') { setStatus('off'); return; }
    const { data, error } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (error || !userId) { if (version === generation.current) setStatus('off'); return; }
    if (localStorage.getItem(`polyplan-push-off:${userId}`) === 'true') { setStatus('off'); return; }
    const saved = await persistDevice(userId);
    if (version === generation.current) setStatus(saved ? 'on' : 'error');
    } catch { setStatus('error'); }
  }, [hasPushApis, installed, isIos]);

  const ensureSubscription = refresh;
  useEffect(() => {
    void refresh();
    const wake = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('online', wake);
    window.addEventListener('focus', wake);
    document.addEventListener('visibilitychange', wake);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      ++generation.current;
      setStatus('off');
      // Keep SDK calls outside the auth callback to avoid an auth lock deadlock.
      if (event === 'SIGNED_OUT') {
        void (async () => {
          if (subscriptionWork) await subscriptionWork;
          const { data: current } = await supabase.auth.getUser();
          if (current?.user) return; // Do not tear down a newly signed-in account.
          await clearDevice();
          const reg = await navigator.serviceWorker.getRegistration(PUSH_SW_URL);
          await (await reg?.pushManager.getSubscription())?.unsubscribe();
          deviceOwner = null;
        })().catch(() => {});
      } else if (event === 'SIGNED_IN') setTimeout(() => { void refresh(); }, 0);
    });
    return () => {
      ++generation.current;
      data.subscription.unsubscribe();
      window.removeEventListener('online', wake);
      window.removeEventListener('focus', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [refresh]);

  const enable = useCallback(async (): Promise<'enabled' | 'denied' | 'needs-install' | 'unsupported' | 'error'> => {
    if (isIos && !installed) return 'needs-install';
    if (!supported) return 'unsupported';
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus(permission === 'denied' ? 'blocked' : 'off'); return 'denied'; }
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) { setStatus('error'); return 'error'; }
      const userId = data.user.id;
      localStorage.removeItem(`polyplan-push-off:${userId}`);
      const version = ++generation.current;
      const saved = await persistDevice(userId);
      if (version !== generation.current) return 'error';
      setStatus(saved ? 'on' : 'error');
      return saved ? 'enabled' : 'error';
    } catch { setStatus('error'); return 'error'; }
    finally { setBusy(false); }
  }, [installed, isIos, supported]);

  const disable = useCallback(async () => {
    ++generation.current;
    setBusy(true);
    try {
      if (subscriptionWork) await subscriptionWork;
      const { data, error: authError } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      if (authError || !userId) { setStatus('error'); return; }
      localStorage.setItem(`polyplan-push-off:${userId}`, 'true');
      const registration = await navigator.serviceWorker.getRegistration(PUSH_SW_URL);
      const subscription = await registration?.pushManager.getSubscription();
      let failed = false;
      if (subscription) {
        const { error } = await supabase.from('push_subscriptions').delete()
          .eq('endpoint', subscription.endpoint).eq('user_id', userId);
        failed = !!error;
        await subscription.unsubscribe();
      }
      await clearDevice();
      setStatus(failed ? 'error' : 'off');
    } catch { setStatus('error'); }
    finally { setBusy(false); }
  }, []);

  const sendTest = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: { title: t('ui.testNotification'), body: t('ui.pushWorksOnDevice') },
    });
    if (error || data?.error) throw new Error('push-test-failed');
    if (!data?.sent) throw new Error('push-not-accepted');
    return data as { sent?: number; removed?: number };
  }, [t]);

  return {
    status,
    busy,
    isIos,
    browser,
    installed,
    hasPushApis,
    supported,
    permission:
      typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
    enable,
    disable,
    sendTest,
    refresh,
    ensureSubscription,
  };
};
