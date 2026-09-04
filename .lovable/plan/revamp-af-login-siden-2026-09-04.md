# Revamp af login-siden

## Mål
Giv `/login` et helt nyt, friskt udtryk i både opsætning og layout — men med de eksisterende brandfarver (Polygon-blå via `bg-polygon-blue`, hvide/neutrale flader og appens semantiske tokens). Login-formularen (`EnhancedSecureLoginForm`) og al adfærd (auth-flow, sprog, redirect, "velkommen tilbage"-navn, afdelingsnavn) bevares uændret — kun det visuelle ændres.

## Nyt design (forslag)
**Retning: moderne, rolig SaaS-side med asymmetrisk komposition og dybde — ikke klassisk 50/50 split.**

- **Baggrund:** Lys, næsten hvid flade (`#f8fafc`) med et stort, blødt blåt "glow"-felt (radial gradient i Polygon-blå ved lav opacitet) og et diskret ugelignende kalender-grid mønster i baggrunden — en visuel reference til selve ugeplanen.
- **Kompakt flydende login-kort:** Centreret, hvidt kort med blød skygge og `rounded-2xl`, Polygon-logo ovenpå, "Velkommen"-overskrift og selve formularen. Under kortet: kort linje med afdeling/internt system + copyright.
- **Brand-strimmel:** En tynd, solid Polygon-blå bjælke øverst på siden (eller venstre kant på desktop) som farveanker, så brandet er tydeligt uden at fylde halve skærmen.
- **Feature-piller:** De tre nuværende punkter (Ugeplan, Vagter & ferie, Adgang pr. afdeling) vises som små kompakte "piller" med ikon under kortet i stedet for et stort venstre panel.
- **Motion:** Bevar de fine fade-in animationer, men med lettere stagger; ingen tunge effekter (god performance, kørsel på kiosk/mobile enheder).
- **Responsivt:** Én ensartet visning på mobil, tablet og desktop — mobil får logo + kort + piller stakket pænt uden det gamle fuldblå banner.

## Tekniske detaljer
- Ændring sker kun i `src/pages/LoginPage.tsx` (+ evt. små justeringer i `EnhancedSecureLoginForm.tsx` hvis kortets udseende kræver det — kun styling).
- Alle farver via tokens (`bg-polygon-blue`, `bg-background`, `text-foreground`, `text-muted-foreground`) — ingen hardcoded hex i komponenterne.
- Bevarer oversættelsesnøgler (`t('login.welcomeMessage')`, `login.loginSubtext` osv.) og dansk/engelsk-logik.
- `Login Branding`-reglen (SaaS-layout, icon-logo) overholdes; kopien tilpasses kun minimalt.
- Verificeres med typecheck + visuel gennemgang af `/login` i preview (mobil- og desktopbredde).
- Opdaterer `CHANGELOG.md` og `docs/implementation-plan/tasks.md` efter gældende rutiner.

## Begrænsninger
- Ingen ændring i auth-logik, Supabase-kald, rate limiting eller sikkerhedsadfærd.
- Ingen nye farver uden for eksisterende palette.
