## Audit-resultat

- **Topbar-stribe:** `AppTopBar.tsx` linje 88 rendrer `<div className="brand-stripe h-px w-full" />`. Klassen er defineret i `src/index.css` (linje 250–258) som en horisontal primary-gradient. Topbar har allerede `border-b border-border` (sammen med sidebar), så stregen er ren dekoration.
- **WelcomeHeader venstre-stribe:** `WelcomeHeader.tsx` linje 56 bruger ikke `::before`, men en inline `<div aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />` (kombineret med `relative … overflow-hidden` på rod-`div`). Behandles som WelcomeHeaders venstre-stribe.
- **Dashboard-card venstre-stribe:** `.brand-card-accent::before` (index.css 272–286) er en 3px primary-gradient venstrekant. Bruges i `VacationNotificationsPanel.tsx` og `WeeklyAssignments.tsx`. Begge cards har allerede `border` via shadcn `Card`.
- **Token-note:** projektet eksponerer ikke `--color-border-tertiary`. Standard-borderen er `hsl(var(--border))`, som allerede ligger på sidebar, topbar og `Card`. Det dækker den separations-rolle planen efterspørger.

Ikke berørt: `.brand-card-header` (svag blå gradient øverst i card-header) og `.brand-dot` (lille farvet prik foran section-titel) — det er ikke stripes, og de blev ikke nævnt i opgaven.

## Planlagte ændringer

### `src/components/Layout/AppTopBar.tsx`
- Fjern brand-stripe `<div>` (linje 87–88) inkl. kommentar. Topbar beholder sin nuværende `border-b border-border`.

### `src/components/Dashboard/WelcomeHeader.tsx`
- Fjern det venstre stripe-`<div>` (linje 56).
- Fjern `relative` og `overflow-hidden` fra rod-`div` (kun nødvendige for stripen).

### `src/components/Dashboard/VacationNotificationsPanel.tsx`
- Fjern `brand-card-accent`-klasse fra `Card` (linje 41).

### `src/components/Dashboard/WeeklyAssignments.tsx`
- Fjern `brand-card-accent`-klasse fra `Card` (linje 224).

### `src/index.css`
- Slet `.brand-stripe` (250–258).
- Slet `.brand-card-accent` + `.brand-card-accent::before` (272–286).
- Behold `.brand-card-header`, `.brand-dot`, `.kpi-number`, `.list-row-selected`, `.brand-surface` — ikke stripes, primary-farven optræder her som tonet baggrund / tekst, ikke som dekorativ kant.

### `CHANGELOG.md`
- Tilføj entry "Brand-stripes fjernet — separation via border" øverst med kort opsummering.

## Verifikation

- `grep brand-stripe\|brand-card-accent src/` → kun definitionerne forsvinder; ingen efterladte forbrugere.
- Browser-screenshot af `/` (Dashboard) for at bekræfte at WelcomeHeader, VacationNotificationsPanel og WeeklyAssignments stadig adskilles tydeligt af card-border + topbar/sidebar-border, uden de blå stripes.

## Out of scope

- Ingen ændring af interaktive primary-elementer (knapper, aktive nav-items, links).
- Ingen ændring af `.brand-card-header` gradient eller `.brand-dot` markør.
- Ingen ændring af shadcn `Card`-base eller border-tokens.
