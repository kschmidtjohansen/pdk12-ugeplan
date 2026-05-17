import * as Sentry from '@sentry/react';

const PII_KEYS = /^(email|e_mail|phone|telephone|mobile|tlf|address|adresse|zip|postnr|city|by)$/i;

const scrub = (val: unknown): unknown => {
  if (Array.isArray(val)) return val.map(scrub);
  if (val && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = PII_KEYS.test(k) ? '[redacted]' : scrub(v);
    }
    return out;
  }
  return val;
};

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete (event.user as Record<string, unknown>).phone;
        delete (event.user as Record<string, unknown>).address;
      }
      if (event.request?.data) event.request.data = scrub(event.request.data);
      if (event.extra) event.extra = scrub(event.extra) as Record<string, unknown>;
      if (event.contexts) event.contexts = scrub(event.contexts) as typeof event.contexts;
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) => ({
          ...b,
          data: b.data ? (scrub(b.data) as Record<string, unknown>) : b.data,
        }));
      }
      return event;
    },
  });
};

export { Sentry };
