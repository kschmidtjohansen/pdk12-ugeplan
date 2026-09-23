# Plan: Minimerbare kort på vagtplanen

## Mål
"Vagter i dag" og "Find nærmeste vagtperson" på `/duty` skal kunne foldes sammen, så de kun fylder én kompakt linje, når de ikke bruges. Valget huskes, så siden åbner i samme tilstand næste gang.

## Udseende
- Hvert kort får en klikbar overskriftslinje med titel og en lille pil (chevron), der drejer ved åben/lukket.
- Lukket tilstand: kun overskriftslinjen er synlig. For "Vagter i dag" vises en kort dæmpet tekst ved siden af titlen, fx "2 på vagt" eller "Ingen vagter i dag", så nøgleinfo ikke forsvinder helt.
- Åben/lukket animeres roligt (højde + gennemsigtighed, som resten af appen).
- Hele overskriftslinjen kan trykkes på (44×44 px trykflade på mobil) og virker med tastatur (`aria-expanded`).

## Teknisk
- `src/components/Duty/TodayDutyCard.tsx`: overskriften bliver en knap med `ChevronDown`/`ChevronUp` (lucide). Indholdet pakkes i en container med `grid-rows-[0fr]/[1fr]`-transition. Lukket vises et lille badge med antal vagter i dag (eller "Ingen vagter").
- `src/components/Duty/DutyProximitySearch.tsx`: samme mønster — klikbar overskrift med chevron, indhold foldes ind. Lukket vises ingen ekstra tekst (søgning er passiv indtil den bruges).
- Tilstand gemmes i `localStorage` pr. kort (`duty.todayCard.open`, `duty.proximity.open`), så valget overlever genindlæsning. Standard: åben første gang (som i dag), så ingen mister funktionen af øje.
- Ingen ændringer i `DutyPage.tsx` udover ingenting — kortene håndterer selv deres tilstand.
- Oversættelser: tilføj `duty.collapse` / `duty.expand` (aria-labels) i `src/translations/da/duty.ts` og `src/translations/en/duty.ts`.

## Verifikation
- Typecheck + lint.
- Playwright: åbn `/duty`, fold begge kort sammen, genindlæs siden og bekræft at de forbliver lukkede; fold ud igen og bekræft at indhold (telefonnumre, søgefelt) virker.
- Opdater `CHANGELOG.md` og `tasks.md` efter godkendt arbejde.
