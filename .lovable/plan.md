## Mål
Tilføj kiosk-rotation til `/screen-display` så storskærme automatisk cykler gennem alle under­afdelinger under en valgt hovedafdeling, med visuel countdown og angivelse af hvilken under­afdeling der vises.

## URL-parametre
Udvider eksisterende `?date=...&departmentId=...&subDepartmentId=...` i `src/pages/ScreenDisplayPage.tsx`:

- `rotate=true` — aktiverer rotation. Default `false`.
- `interval=N` — sekunder pr. under­afdeling. Default `30`, min `5`, max `600` (clamp for at undgå urealistiske værdier).

Rotation aktiveres kun hvis `rotate=true` OG `departmentId` er sat OG der findes ≥ 2 under­afdelinger. Ellers opfører siden sig som i dag.

## Adfærd

1. Når rotation er aktiv:
   - Hent én gang listen af `sub_departments` for `departmentId` (sorteret efter `name`).
   - Hvis URL'en allerede har `subDepartmentId`, start på den i listen; ellers start på index 0.
   - `setInterval(..., interval * 1000)` skifter til næste sub-dept (wrap-around).
   - Det aktive `subDepartmentId` sendes til `useScreenDisplayData(...)` præcis som i dag, så eksisterende data­fetching og isolation genbruges uændret.
   - Interval ryddes i `useEffect`-cleanup (også når `interval`/listen ændres).

2. Visning:
   - Øverst til højre: lille pill med navnet på aktuel under­afdeling (vises kun ved rotation).
   - Nederst: tynd progress bar (`h-1`, fuld bredde, `bg-primary`) over `bg-muted`. Width animeres fra `100%` → `0%` via `transition-[width] duration-[Nms] ease-linear`. Reset opnås ved at give baren en `key={rotationIndex}` så React remounter elementet ved hvert skifte.
   - Bar vises kun ved rotation.

3. URL-vedligehold:
   - `updateUrlDate` opdateres så `rotate` og `interval` bevares ved dato-navigation.
   - Ved hvert rotationsskift opdateres `subDepartmentId` i URL'en via `history.replaceState` (uden reload), så et reload fortsætter samme sted.

4. Ingen ændringer i `ScreenDisplayHeader`, `ScreenDisplayContent` eller `useScreenDisplayData` — kun page-niveau.

## Tekniske detaljer

- Ny lille hook eller inline `useEffect` i `ScreenDisplayPage.tsx` til at hente sub-dept listen via `supabase.from('sub_departments').select('id, name, department_id').eq('department_id', departmentId).order('name')`.
- State: `subDepartmentsList`, `rotationIndex`, afledt `activeSubDeptId`.
- Progress bar bruger CSS-transition og `key` til reset; ingen `requestAnimationFrame`-loop nødvendig.
- Pause når `document.visibilityState === 'hidden'`: spring over for at holde scope smalt — kan tilføjes senere hvis ønsket.

## Filer der ændres

- `src/pages/ScreenDisplayPage.tsx` — parse nye URL params, fetch sub-depts, rotation-interval, progress bar, top-right label, bevar params i `updateUrlDate`.

Ingen DB-, oversættelses- eller hook-ændringer.