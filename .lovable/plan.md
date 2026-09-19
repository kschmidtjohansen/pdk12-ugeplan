# Fase 2: Hurtige gevinster

Fem afgrænsede forbedringer af brugervenlighed, tilgængelighed og indlæsningstid. Ingen ændringer i data, rettigheder eller forretningslogik.

## 1. Større trykflader på mobil

Handlingsknapperne i ugeplanen (rediger, kopiér, udgiv, vis på skærm, slet samt knapperne i "Ikke tildelte ressourcer" og søgefeltets ryd-knap) er 28 × 28 px. Anbefalingen for touch er mindst 44 × 44 px, og de sidder tæt på hinanden, så fejltryk er nemme.

- På telefon og tablet får knapperne en trykflade på 44 × 44 px, mens selve ikonet og den kompakte række ser ud præcis som i dag.
- På desktop bevares det nuværende kompakte udseende uændret.

## 2. Skærmlæser-venlige ikonknapper

Ikonknapperne har kun et værktøjstip ved museover, som hverken oplæses konsekvent eller vises på berøring. Hver knap får en beskrivende tekst til skærmlæsere på dansk/engelsk via de eksisterende oversættelser.

## 3. Farver via designsystemet på handlingsknapperne

Udgiv-knappen (grøn) og slet-knappen (rød) bruger faste farveklasser i stedet for projektets farvetokens. De lægges om til systemets semantiske farver, så de følger temaet. Kun disse handlingsknapper røres i denne omgang — de øvrige 55 filer med faste farver tages som en selvstændig opgave senere.

## 4. Hurtigere første indlæsning

- ZIP-værktøjet (bruges kun ved "hent alle filer" på en opgave) indlæses nu på forhånd i hovedpakken. Det gøres til en efterspørgselsindlæsning, så det først hentes, når man faktisk downloader filer.
- Testværktøjer (vitest, jsdom, testing-library, jest-typer) ligger blandt appens driftsafhængigheder. De flyttes til udviklingsafhængigheder, så de ikke kan ende i produktionsopbygningen.

## 5. Kvalitetstjek

Typetjek og kodetjek skal være rene. Visuel gennemgang af ugeplanen i Standard-, Kompakt- og Gittervisning samt dashboard på både mobil og desktop. `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres.

## Tekniske detaljer

- Trykflade: `h-7 w-7` bevares visuelt; der tilføjes `relative` + `before:absolute before:-inset-[8px] before:content-[''] sm:before:hidden` (eller `min-h-11 min-w-11 sm:min-h-0 sm:min-w-0` hvor layoutet tillader det) i `AssignmentActionButtons.tsx`, `CompactAssignmentRow.tsx`, `UnassignedResourcesSection.tsx` og `PlannerSearchFilter.tsx`.
- `aria-label` sættes til samme oversættelsesnøgle som `title` på alle ikon-kun-knapper i de samme filer.
- Farver: `text-green-600 hover:bg-green-50` → `text-success`-token (tilføjes i `index.css`/`tailwind.config.ts` hvis den mangler), `text-red-600` → `text-destructive`.
- `jszip`: `import JSZip from 'jszip'` i `src/hooks/assignment/useAssignmentFiles.ts` erstattes af `const { default: JSZip } = await import('jszip')` inde i download-funktionen.
- `package.json`: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@types/jest` og `rollup-plugin-visualizer` flyttes til `devDependencies`.

## Herefter

Punkt 3 (nice-to-have) planlægges særskilt: ét autoritativt datalag, udfasning af `any`-typer, virtualisering i store ugeplaner og ensartede indlæsningstilstande.
