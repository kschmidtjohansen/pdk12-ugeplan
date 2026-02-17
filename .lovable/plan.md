

## Favicon-opdatering + Login UI-renovering

### Aendringer

#### 1. Nyt SVG-favicon: `public/favicon.svg`

Opretter en ny fil med kun ikon-delen af Polygon-logoet (den geometriske figur med graa og blaa gradient — uden "POLYGON"-teksten). SVG-formatet giver skarpt favicon i alle stoerrelser.

Ikonet bestar af tre SVG-paths:
- Graa ydre form (tre bueformede elementer)
- Blaa gradient-cirkel/trekant (det centrale ikon)

ViewBox tilpasses til `0 0 64 64` sa ikonet fylder hele faviconet.

#### 2. `index.html`

Opdater favicon-referencen fra `.ico` til `.svg`:
```
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

Behold `apple-touch-icon` med den nye SVG (eller behold `.ico` som fallback).

#### 3. Login UI-renovering (fra den godkendte plan)

Implementeres samtidig:

**`src/pages/LoginPage.tsx`:**
- Subtil gradient-baggrund (fra `background` til `muted/30`)
- `animate-fade-in` pa containeren
- Tekst-hierarki: "Velkommen tilbage" (text-2xl, semibold) + "Log ind pa din ugeplan" (text-sm, muted)

**`src/components/Auth/EnhancedSecureLoginForm.tsx`:**
- Card: `shadow-lg rounded-xl border-border/50`
- Fjern `CardDescription` (teksten flyttes til LoginPage)
- `animate-fade-in` pa fejl-alerts
- DEV-guard pa `console.error` linje 89
- Oversat forsoegs-tekst (erstat hardcoded engelsk)

**Oversaettelser:**
- `da/login.ts`: `welcomeMessage` -> `'Velkommen tilbage'`, ny `loginSubtext`
- `en/login.ts`: `welcomeMessage` -> `'Welcome back'`, ny `loginSubtext`
- Begge: `failedAttempts` noegle for oversat forsoegs-advarsel

#### 4. `CHANGELOG.md`

Dokumenter favicon-opdatering og login UI-renovering.

### Filer der aendres/oprettes

| Fil | Aendring |
|-----|---------|
| `public/favicon.svg` | NY — standalone Polygon-ikon SVG |
| `index.html` | Opdater favicon-reference til SVG |
| `src/pages/LoginPage.tsx` | Gradient-baggrund, fade-in, nyt tekst-hierarki |
| `src/components/Auth/EnhancedSecureLoginForm.tsx` | Card-styling, fjern CardDescription, fade-in pa fejl, DEV-guard |
| `src/translations/da/login.ts` | `welcomeMessage`, `loginSubtext` |
| `src/translations/en/login.ts` | `welcomeMessage`, `loginSubtext` |
| `CHANGELOG.md` | Dokumenter aendringerne |

### Kvalitetstjek
- Favicon viser kun ikon-delen (ingen "POLYGON" tekst)
- SVG-format giver skarpt favicon pa alle skaermstoerrelser
- Login-siden har moderne SaaS-look med gradient, card-shadow og fade-in
- Alle tekster er oversatte (ingen hardcoded engelsk)
- Responsivt design fungerer pa 320px-1920px

