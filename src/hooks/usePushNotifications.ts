import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export type PushStatus = 'unsupported' | 'needs-install' | 'blocked' | 'off' | 'on';

const saveSubscription = async (subscription: PushSubscription) => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return false;

  const json = subscription.toJSON() as { keys?: { p256dh?: string; auth?: string } };
  const p256dh = json.keys?.p256dh ?? arrayBufferToBase64(subscription.getKey('p256dh'));
  const auth = json.keys?.auth ?? arrayBufferToBase64(subscription.getKey('auth'));

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent.slice(0, 300),
      last_seen_at: new Date().toISOString(),
      last_error: null,
    },
    { onConflict: 'endpoint' },
  );

  if (error) {
    if (import.meta.env.DEV) console.error('Push subscription save failed', error);
    return false;
  }
  return true;
};

export const usePushNotifications = () => {
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

  // Installation is a hard requirement on every platform: notifications must
  // belong to the installed app, not to a browser tab.
  const supported = hasPushApis && installed;

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
    if (!hasPushApis) {
      setStatus(!installed ? 'needs-install' : 'unsupported');
      return;
    }
    if (!installed) {
      setStatus('needs-install');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('blocked');
      return;
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration(PUSH_SW_URL);
      const existing = await registration?.pushManager.getSubscription();
      setStatus(existing ? 'on' : 'off');
    } catch {
      setStatus('off');
    }
  }, [hasPushApis, installed]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Silently keeps the device subscribed: when the installed app starts and the
   * user has already granted permission, re-register and re-subscribe if the
   * browser dropped the subscription. The user only approves once per device.
   */
  const ensureSubscription = useCallback(async () => {
    if (!supported) return;
    if (Notification.permission !== 'granted') return;
    try {
      const registration =
        (await navigator.serviceWorker.getRegistration(PUSH_SW_URL)) ??
        (await navigator.serviceWorker.register(PUSH_SW_URL, { scope: '/' }));
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      await saveSubscription(subscription);
      setStatus('on');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Push ensureSubscription failed', err);
    }
  }, [supported]);

  useEffect(() => {
    void ensureSubscription();
  }, [ensureSubscription]);

  const enable = useCallback(async (): Promise<
    'enabled' | 'denied' | 'needs-install' | 'unsupported' | 'error'
  > => {
    if (!installed) return 'needs-install';
    if (!supported) return 'unsupported';
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'blocked' : 'off');
        return 'denied';
      }

      const registration = await navigator.serviceWorker.register(PUSH_SW_URL, { scope: '/' });
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const saved = await saveSubscription(subscription);
      if (!saved) return 'error';

      setStatus('on');
      return 'enabled';
    } catch (err) {
      if (import.meta.env.DEV) console.error('Push enable failed', err);
      return 'error';
    } finally {
      setBusy(false);
    }
  }, [installed, supported]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration(PUSH_SW_URL);
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus('off');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Push disable failed', err);
    } finally {
      setBusy(false);
    }
  }, []);

  const sendTest = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: { title: 'Test-notifikation', body: 'Push-notifikationer virker på denne enhed.' },
    });
    if (error) throw error;
    return data as { sent?: number; removed?: number };
  }, []);

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
