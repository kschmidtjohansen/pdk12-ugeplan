

## Performance-optimering: 6 punkter fra rapporten

### 1. First Contentful Paint (FCP)

**Problem:** Fonten Inter indlæses med 7 vægtklasser (300-900), men kun 300-700 bruges i koden. Derudover blokerer font-preload parsing.

**Rettelse i `index.html`:**
- Reducer Inter font-request til kun `wght@300;400;500;600;700` (fjern 800 og 900 som ikke bruges)
- Tilfoej `font-display=swap` er allerede i Google Fonts URL (via `&display=swap`) - OK
- Tilfoej inline kritisk CSS i `<head>` for loading-spinneren (den foerste ting brugeren ser), saa den vises FOER CSS er indlaest

**Rettelse i `src/components/Layout/NavComponents/Logo.tsx`:**
- AEndr `loading="lazy"` til `loading="eager"` og tilfoej `fetchPriority="high"` - logoet er above-the-fold og skal ikke lazy-loades

### 2. Network Dependency Tree

**Problem:** Sekventiel indlæsning: HTML -> font CSS -> font filer -> app JS. Font CSS-filen loader yderligere font-filer.

**Rettelse i `index.html`:**
- Tilfoej `<link rel="preload">` for den mest brugte Inter font-fil (woff2, weight 400) direkte, saa browseren kan starte download parallelt med CSS
- Behold eksisterende preconnect-hints (allerede godt sat op)

### 3. Unused CSS

**Problem:** `src/App.css` indeholder Vite-default styling (`.logo`, `.read-the-docs`, `.card`, `logo-spin`) som IKKE importeres nogetsteds og aldrig bruges. Filen er 100% ubrugt.

**Rettelse:** Toem `App.css` (behold filen for at undgaa evt. build-fejl, men fjern alt indhold). Filen importeres ikke, saa den pavirker ikke bundlen direkte, men den rydder op i projektet.

**OBS:** `index.css` har en duplikeret `@media (prefers-reduced-motion: reduce)` blok (linje 487-496 og 548-556). Den ene kan fjernes for at reducere CSS-stoerrelsen en smule. Begge blokke goer det samme.

### 4. Unused JS

**Problem:** `performanceMonitor.ts` initialiserer Web Vitals observers globalt ved import. I produktion droppes console-logs via terser, men observer-koden koerer stadig.

**Rettelse i `src/App.tsx`:**
- Flyt `performanceMonitor` import ind i useEffect-blokken med dynamic import, saa den KUN loades i development mode
- I produktion springes hele modulet over

### 5. Render Blocking Requests

**Problem:** Font-stylesheetet i `<head>` er allerede optimeret med `media="print" onload` tricket - det er godt. Men `<link rel="preload" as="style">` paa linje 20 er reelt render-blocking fordi preload med `as="style"` har hoej prioritet.

**Rettelse i `index.html`:**
- Fjern `<link rel="preload">` linjen for font CSS (linje 20) - den er redundant med `media="print" onload` tricket paa linje 21 som allerede loader fonten non-blocking. Preload-linjen modvirker faktisk non-blocking strategien

### 6. Cache Lifetimes

**Problem:** Vite genererer allerede hashed filnavne for JS/CSS chunks (god cache-busting). Men der er ingen eksplicit cache-konfiguration for statiske assets.

**Rettelse:** Tilfoej en `public/_headers` fil (Netlify/Vercel-kompatibel) eller konfigurer caching i Vite's build output. Da projektet deployes via Lovable Cloud, tilfoej cache-headers via en `public/_headers` fil:
- Statiske assets (JS, CSS, fonts, billeder): `Cache-Control: public, max-age=31536000, immutable`
- HTML: `Cache-Control: no-cache` (saa nye deployments altid hentes)
- Alternativt, da Lovable Cloud haandterer headers automatisk for hashed assets, kan vi i stedet sikre at `vite.config.ts` har korrekte asset-naming med hashes (allerede tilfaeldet)

---

### Tekniske detaljer

| Fil | Type | AEndring |
|-----|------|---------|
| `index.html` | OPDATER | Reducer font-vaegt, fjern redundant preload, tilfoej inline kritisk CSS, preload woff2 |
| `src/App.tsx` | OPDATER | Dynamic import af performanceMonitor kun i dev |
| `src/components/Layout/NavComponents/Logo.tsx` | OPDATER | loading="eager" + fetchPriority="high" |
| `src/App.css` | OPDATER | Toem indhold (ubrugt fil) |
| `src/index.css` | OPDATER | Fjern duplikeret prefers-reduced-motion blok |
| `public/_headers` | NY | Cache-headers for statiske assets |

### Sikkerhedsgarantier
- Ingen logik, state eller API-kald aendres
- Ingen oversaettelser eller UI-layout pavirkes
- Alle TypeScript interfaces og props forbliver uaendrede
- Font forbliver Inter med alle de vaegt-klasser der faktisk bruges
- Alle eksisterende funktioner (knapper, forms, navigation) er upaavirkede

