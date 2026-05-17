# Sentry-integration med PII-strip

## Vigtigt om DSN'en
Lovable-projekter har **ingen `.env`-fil** — `VITE_*`-variabler kan ikke tilføjes lokalt. Den foreslåede løsning bliver:

- Læser `import.meta.env.VITE_SENTRY_DSN` (samme API som beskrevet).
- Hvis DSN'en mangler, springer `Sentry.init` over (ingen fejl i preview).
- Du indsætter selv DSN'en når deployet — enten via Lovable's deploy-env eller ved at hardcode den i `main.tsx` (DSN er teknisk set offentlig). Sig til hvilken vej du foretrækker, ellers kører jeg med env-variant.

## Ændringer

### 1. Dependency
- `bun add @sentry/react`

### 2. `src/lib/sentry.ts` (ny)
Samler init + PII-scrubber så alle ErrorBoundaries importerer ét sted:

```ts
import * as Sentry from '@sentry/react';

const PII_KEYS = /^(email|e_mail|phone|telephone|mobile|tlf|address|adresse|zip|postnr|city|by)$/i;

const scrub = (val: unknown): unknown => {
  if (Array.isArray(val)) return val.map(scrub);
  if (val && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = PII_KEYS.test(k) ? '[redacted]' : scrub(v);
    }
    return out;
  }
  return val;
};

export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete (event.user as any).phone;
        delete (event.user as any).address;
      }
      if (event.request?.data) event.request.data = scrub(event.request.data);
      if (event.extra) event.extra = scrub(event.extra) as Record<string, unknown>;
      if (event.contexts) event.contexts = scrub(event.contexts) as any;
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(b => ({ ...b, data: b.data ? (scrub(b.data) as any) : b.data }));
      }
      return event;
    },
  });
};

export { Sentry };
```

### 3. `src/main.tsx`
Kald `initSentry()` før `createRoot`, og wrap `<App />` i `Sentry.ErrorBoundary` med en simpel fallback.

```tsx
import { Sentry, initSentry } from './lib/sentry';
initSentry();
// ...service worker guard uændret...
createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary fallback={<div className="p-6 text-sm">Noget gik galt.</div>}>
    <App />
  </Sentry.ErrorBoundary>
);
```

### 4. Tilføj `Sentry.captureException(error)` i alle 4 eksisterende `componentDidCatch`
- `src/components/ErrorBoundary/DataFetchErrorBoundary.tsx`
- `src/components/ErrorBoundary/GlobalErrorBoundary.tsx`
- `src/components/ErrorBoundary/PlannerWidgetErrorBoundary.tsx`
- `src/components/Layout/SecurityErrorBoundary.tsx`

Eksisterende logging/UI bevares uændret — kun én linje tilføjes øverst i hver `componentDidCatch`.

### 5. `.env`
Lovable har ingen `.env`. Jeg dropper trinnet, medmindre du eksplicit vil have en `.env.example` committet til reference (kan tilføjes).

## Out of scope
- Ingen ændring af `ScreenDisplayErrorBoundary` (functional, ingen `componentDidCatch`).
- Ingen Sentry tracing/replay-integrationer udover `tracesSampleRate`.
- Ingen ændring af bestående fallback-UI'er.
