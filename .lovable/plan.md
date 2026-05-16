## PWA Integration with vite-plugin-pwa

### Goal
Add Progressive Web App support using `vite-plugin-pwa` with `generateSW` strategy, Workbox precaching, and runtime caching for Supabase API calls.

---

### Important Limitation
PWA features (service worker, offline support, install prompt) will only work in the **published/deployed version** (`pdk12.dk` / `pdk12-ugeplan.lovable.app`), not inside the Lovable editor preview. The service worker must be guarded so it never registers in preview iframe contexts.

---

### Implementation Steps

#### 1. Install `vite-plugin-pwa`
```bash
bun add -D vite-plugin-pwa
```

#### 2. Update `vite.config.ts`
Add the `VitePWA` plugin with the following configuration:

| Option | Value |
|--------|-------|
| `registerType` | `'autoUpdate'` |
| `devOptions.enabled` | `false` (never register SW in development) |
| `manifest.name` | `'Polygon Ugeplan'` |
| `manifest.short_name` | `'Ugeplan'` |
| `manifest.theme_color` | `'#00aeef'` |
| `manifest.icons` | Single icon entry: `src: '/favicon.png', sizes: '192x192', type: 'image/png'` |
| `manifest.start_url` | `'/'` |
| `manifest.display` | `'standalone'` |

**Workbox configuration (`workbox` key):**
- `navigateFallbackDenylist`: exclude `[^/]+~oauth` (internal Supabase/auth routes)
- `runtimeCaching`:
  - **HTML navigations**: `NetworkFirst`, 3s network timeout, cache name `"html"`
  - **Supabase REST API**: match `request.destination === ''` + URL hostname includes `supabase.co`, strategy `NetworkFirst`, cache name `"supabase-api"`, `maxAgeSeconds: 300` (5 minutes), `maxEntries: 100`
  - **Static assets** (JS/CSS/fonts/images): `CacheFirst`, cache name `"static-assets"`, `maxAgeSeconds: 31536000` (1 year)
- `globPatterns`: `['**/*.{js,css,html,woff2,png,svg}']` (precache build output)
- `cleanupOutdatedCaches`: `true`

#### 3. Add service-worker registration guard to `src/main.tsx`
Insert before `createRoot()`:
```typescript
const isInIframe = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
const isPreviewHost = window.location.hostname.includes('id-preview--') || window.location.hostname.includes('lovableproject.com');

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
}
```
This prevents the service worker from interfering with the Lovable editor preview.

#### 4. Add manifest link to `index.html`
Insert inside `<head>`:
```html
<link rel="manifest" href="/manifest.webmanifest" />
```

#### 5. Verify build succeeds
Run `bun run build` and confirm no errors. The plugin auto-generates `manifest.webmanifest` and the service worker in `dist/`.

---

### Files Modified
- `vite.config.ts` — add `VitePWA` plugin import and configuration
- `src/main.tsx` — add SW registration guard
- `index.html` — add manifest link
- `package.json` — add `vite-plugin-pwa` devDependency

### Files Generated (at build time)
- `dist/manifest.webmanifest`
- `dist/sw.js` (Workbox service worker)

### Not in Scope
- Background sync (explicitly excluded per request)
- Custom icon sizes beyond existing `favicon.png`
- Push notifications
