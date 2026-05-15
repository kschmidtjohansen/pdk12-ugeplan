## Audit-resultat

`src/components/Dashboard/WelcomeHeader.tsx`:
- Format: `format(now, 'HH:mm')` — bekræftet, **ingen sekunder**.
- `setInterval(..., 30000)` på linje 32 — 30s er hurtigere end den ønskede 60s grænse.
- `getHeaderDateDisplay()`, `clockString` og `greeting` udregnes inline ved hver render uden `useMemo`.

## Planlagte ændringer

### `src/components/Dashboard/WelcomeHeader.tsx`
- Opdel `now` i to states: `clockNow` (kun til HH:MM) og `mountedNow` (sat én gang ved mount, bruges til date/week/greeting).
- Ændr `setInterval` fra `30000` → `60000`. Align første tick til næste hele minut, så uret ikke driver et halvt minut bagud (lille `setTimeout` ved mount, derefter 60s interval; oprydning fjerner begge).
- Indpak `headerDate` (dayName, weekNumber, dateString) og `greeting` i `useMemo` baseret på `mountedNow` + `currentLanguage` + `name` — opdateres kun ved mount / sprog- / navne-skift, ikke ved hvert minut-tick.
- `clockString = useMemo(() => format(clockNow, 'HH:mm'), [clockNow])` — opdateres pr. tick.
- Tilføj `import { useMemo } from 'react'`.

### `CHANGELOG.md`
Tilføj entry "WelcomeHeader: 60s ur-interval + useMemo for dato/uge/hilsen".

## Verifikation

- Visuelt: HH:MM i preview, ingen sekunder, ingen tekstskift før næste hele minut.
- Konsol-log midlertidigt verificeres ikke (ingen ekstra logs tilføjes; inspektion sker via React DevTools ved behov).

## Out of scope

- Statisk-uge-linje (afvist af PO).
- Andre Dashboard-komponenter.
- Ændring af `Greeting`-tærskler eller dato-format.
