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
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
};

const detectIos = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
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

export type PushStatus = 'unsupported' | 'blocked' | 'ios-needs-install' | 'off' | 'on';

export const usePushNotifications = () => {
  const [status, setStatus] = useState<PushStatus>('unsupported');
  const [busy, setBusy] = useState(false);
  const isIos = detectIos();

  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !isPreviewContext();

  const refresh = useCallback(async () => {
    if (!supported) {
      setStatus(isIos && !isStandalone() ? 'ios-needs-install' : 'unsupported');
      return;
    }
    if (isIos && !isStandalone()) {
      setStatus('ios-needs-install');
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
  }, [supported, isIos]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async (): Promise<
    'enabled' | 'denied' | 'unsupported' | 'error'
  > => {
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

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return 'error';

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
        return 'error';
      }

      setStatus('on');
      return 'enabled';
    } catch (err) {
      if (import.meta.env.DEV) console.error('Push enable failed', err);
      return 'error';
    } finally {
      setBusy(false);
    }
  }, [supported]);

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

  return { status, busy, isIos, supported, enable, disable, sendTest, refresh };
};
