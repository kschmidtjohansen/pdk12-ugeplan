## Plan: Wrap full ScreenDisplayPage + neutral kiosk-friendly fallback

### Findings
- `ScreenDisplayPage.tsx` currently only wraps the **success branch** (line 169) in `<ScreenDisplayErrorBoundary>`. The early `loading` (l. 134) and `error` (l. 148) returns render OUTSIDE the boundary, so a render-time crash in those branches is uncaught.
- `ScreenDisplayErrorBoundary.tsx` fallback uses `bg-destructive/5`, a destructive icon and "Screen Display Error" copy — too loud for a TV/kiosk and not branded.
- Polygon logo is loaded elsewhere from `https://www.polygongroup.com/UI/build/svg/polygon-logo.svg` (used in `LoginPage.tsx`); a local `public/polygon-mark.png` also exists.
- Route is registered in `src/App.tsx` (the page component is the route element); boundary belongs in the page so it still catches errors thrown by hooks inside it.

### Changes

**1. `src/components/ScreenDisplay/ScreenDisplayErrorBoundary.tsx`**
- Extract a small internal `ScreenDisplayFallback` component so it can use hooks.
- Layout: full-screen `bg-background` (no gradient, no destructive color), centered column with:
  - Polygon SVG logo (`https://www.polygongroup.com/UI/build/svg/polygon-logo.svg`, height ~48px, `alt="Polygon"`).
  - Neutral heading: `Skærmen er ikke tilgængelig`.
  - Muted sub-line indicating an auto-reload is pending.
  - Optional small "Genindlæs nu" button calling `window.location.reload()` (kept minimal, no destructive styling).
- `useEffect` sets `setInterval(() => window.location.reload(), 60_000)` and clears it on unmount. No coloured backgrounds.
- Drop the `date` and `onRetry` props from the fallback — irrelevant in kiosk mode (kept on the wrapper for backward-compat / logging only).

**2. `src/pages/ScreenDisplayPage.tsx`**
- Move `<ScreenDisplayErrorBoundary>` to wrap the **entire** returned tree (loading / error / success branches all inside). Simplest form: refactor the function to compute one `content` JSX value via `if/else` and return `<ScreenDisplayErrorBoundary ...>{content}</ScreenDisplayErrorBoundary>` once.

**3. `CHANGELOG.md`** — entry: "ScreenDisplayPage: full-page ErrorBoundary + neutral kiosk fallback med Polygon-logo og 60s auto-reload".

### Out of scope
- `App.tsx` route definition (page-level boundary suffices).
- Translation system (page already mixes EN/DA copy; we use Danish here per request).
- Existing inline error UI at l. 148–166 stays — it handles known data-fetch errors with a Retry button; the boundary is for unexpected render crashes.