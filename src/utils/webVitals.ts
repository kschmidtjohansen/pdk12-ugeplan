/**
 * Core Web Vitals reporter.
 * - Logs each metric to the console in DEV.
 * - Batches metrics and flushes to Supabase (`web_vitals_metrics`) on page hide.
 *
 * Initialised once from `src/App.tsx`.
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';

type QueuedMetric = {
  metric_name: string;
  metric_value: number;
  rating: string | null;
  route: string;
  user_id: string | null;
  department_id: string | null;
  device_type: string;
  connection_type: string | null;
  user_agent: string;
  session_id: string;
};

const SESSION_KEY = 'wv_session_id';

const getSessionId = (): string => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
};

const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
};

const getConnectionType = (): string | null => {
  const conn = (navigator as any).connection;
  return conn?.effectiveType ?? null;
};

const queue: QueuedMetric[] = [];
let initialized = false;

const flush = async () => {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  try {
    // Fire-and-forget. Errors are non-critical telemetry.
    await supabase.from('web_vitals_metrics').insert(batch);
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[WebVitals] flush failed', err);
  }
};

const handleMetric = (metric: Metric) => {
  const route = window.location.pathname;
  if (import.meta.env.DEV) {
    console.log(
      `[WebVitals] ${metric.name}=${metric.value.toFixed(2)} (${metric.rating}) on ${route}`
    );
  }

  // Resolve current user (best-effort, async). We snapshot before queueing.
  supabase.auth.getUser().then(({ data }) => {
    const user = data.user;
    // Skip the demo user to avoid noise.
    if (user?.id === '165cdbc9-6722-4c96-97d2-1a87185c8133') return;

    queue.push({
      metric_name: metric.name,
      metric_value: metric.value,
      rating: metric.rating ?? null,
      route,
      user_id: user?.id ?? null,
      department_id: null, // can be enriched later via app_metadata if available
      device_type: getDeviceType(),
      connection_type: getConnectionType(),
      user_agent: navigator.userAgent.slice(0, 500),
      session_id: getSessionId(),
    });
  });
};

export const initWebVitals = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const start = () => {
    onLCP(handleMetric);
    onINP(handleMetric);
    onCLS(handleMetric);
    onFCP(handleMetric);
    onTTFB(handleMetric);
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(start, { timeout: 2000 });
  } else {
    setTimeout(start, 1500);
  }

  // Flush on page hide / unload — covers tab close, navigation away, app switch.
  const onHide = () => {
    if (document.visibilityState === 'hidden') void flush();
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', () => void flush());
};
