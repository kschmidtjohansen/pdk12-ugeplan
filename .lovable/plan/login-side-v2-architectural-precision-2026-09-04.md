# Login-side v2 — "Architectural Precision"

## Mål
Løft login-siden yderligere i den valgte retning "Architectural Precision": mere dybde, flydende logo-badge der overlapper login-kortet, blå accentlinje på kortet, dot-mønster i baggrunden og fine interaktionseffekter. Samme indhold og adfærd som nu (login-formular, sprog, velkomst-hilsen, afdeling).

## Design (fra valgt prototype)
- **Baggrund:** Lys flade (`bg-background`) med to bløde blå glow-felter (brand-blå `--primary`, lav opacitet, stor blur) i hhv. øverste venstre og nederste højre hjørne + et fint dot-grid mønster (radial-gradient prikker, 32px, meget lav opacitet). Token-baserede utilities i `index.css`.
- **Flydende logo-chip:** Hvid chip med Polygon-logo og skygge, der overlapper toppen af login-kortet (negativ margin), med en blød hover-scale effekt.
- **Login-kort:** Hvidt/let gennemskinneligt kort (`bg-card/80 backdrop-blur-xl`), `rounded-[2.5rem]`, stor blød skygge i brand-blå tone, med en 6px solid brand-blå accentlinje øverst inde i kortet. Overskrift + underoverskrift flyttes ind i kortet.
- **Login-formularen:** `EnhancedSecureLoginForm` styles om (kun visuelt): større felter med `rounded-2xl`, fokus-ring i brand-blå, uppercase mikro-labels, og login-knappen får pil-ikon med hover-forskydning og blå skygge. Al logik (fejlhåndtering, husk mig, rate limiting, offline-tilstand) bevares urørt.
- **Feature-piller:** Flyttes ind i bunden af kortet over en tynd skillelinje; små piller med blå prik og hover-effekt (lettere blå baggrund/tekst).
- **Footer:** Diskret linje under kortet med copyright + "Internt system".
- **Effekter/motion:** Staggered fade-in ved indlæsning, langsom hover-scale på logo-chip, hover-lift på piller, fokus-glow på felter, knap med pil-animation. Ingen tunge animationer (kiosk/mobile-venligt).

## Tekniske detaljer
- Filer: `src/pages/LoginPage.tsx` (ny komposition), `src/components/Auth/EnhancedSecureLoginForm.tsx` (kun styling af Card/inputs/knap), `src/index.css` (token-baserede utilities: glow, dot-grid).
- Alle farver via tokens (`--primary`, `bg-card`, `text-muted-foreground`, `bg-polygon-blue` kun hvor den allerede bruges som token) — ingen hardcoded hex.
- Bevarer oversættelsesnøgler og da/en-logik. Footer-tekst som i dag (© år Polygon Group · Internt system).
- Verificeres med typecheck + visuel gennemgang i preview (desktop + mobil).
- `CHANGELOG.md` opdateres efter gældende rutiner.

## Begrænsninger
- Ingen ændring i auth-logik eller sikkerhedsadfærd.
- Ingen nye brandfarver.
