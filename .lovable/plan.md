## Mål

Erstat den animerede mesh/blob-baggrund i login-sidens venstre panel (og mobil-banneret) med en ren, solid Polygon brand-blå `#00aeef`. Fjern logo-shimmer og de tre mesh-float-animationer. Behold logo, tagline og feature-cards — bare på den flade farve.

## Ændringer

### `src/pages/LoginPage.tsx`
- Slet hele `MeshBackground`-komponenten (linje 55–98) inkl. de 3 animerede blob-divs, motion-reduce fallback-blobs og det subtile grid-overlay.
- Erstat med en simpel `<div aria-hidden className="absolute inset-0 bg-polygon-blue" />` (ny semantisk farve, se nedenfor).
- Fjern `animate-logo-shimmer`-klassen begge steder (linje 109 og 133). Logo-containerne beholdes som de er (white/15 backdrop-blur boks).
- Behold alt øvrigt indhold uændret: headline, sub-headline, feature-cards, fade-in-animationer på indhold, sprog/tema-knapper.

### `tailwind.config.ts`
- Tilføj farve-token `polygon: { blue: '#00aeef' }` under `colors.extend` (eller direkte `polygonBlue`) så `bg-polygon-blue` kan bruges. Alternativt mappes til en CSS-variabel `--polygon-blue` i `index.css` og refereres via `hsl(var(--polygon-blue))` for konsistens med resten af design-systemet — anbefalet variant.
- Fjern keyframes: `mesh-drift`, `mesh-drift-alt`, `mesh-float-1`, `mesh-float-2`, `mesh-float-3`, `logo-shimmer`.
- Fjern tilsvarende entries under `animation`: `mesh-drift`, `mesh-drift-alt`, `mesh-float-1`, `mesh-float-2`, `mesh-float-3`, `logo-shimmer`.
- Bevar `fade-in-down`, `scale-in`, `slide-in-*` og øvrige animationer — de bruges andre steder.

### `src/index.css`
- Tilføj `--polygon-blue: 196 100% 47%;` (HSL for `#00aeef`) i `:root` og dark-blok så token-systemet er konsistent.

## Verifikation

Efter ændringerne: kør grep for at sikre at ingen anden fil refererer til de fjernede animations-klasser (forventet ingen hits uden for konfigurationen). Tag et browser-screenshot af `/login` for at bekræfte det rene split-screen look uden blobs eller shimmer.

## Out of scope

- Ingen ændringer i selve login-formen (højre panel).
- Ingen ny funktionalitet, oversættelser eller routing-ændringer.
- Ingen oprydning af andre animations-klasser end de 6 nævnte.
