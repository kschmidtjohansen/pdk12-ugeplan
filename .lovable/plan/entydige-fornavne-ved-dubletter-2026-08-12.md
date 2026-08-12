# Entydige fornavne ved dubletter

Når to medarbejdere i samme afdeling har samme fornavn, skal visningen tilføje efternavnets første bogstav: "Mette J" og "Mette L".

## Adfærd

- Er fornavnet unikt i afdelingen: vis kun fornavnet (uændret).
- Er der dubletter: vis "Fornavn X" hvor X er efternavnets første bogstav.
- Er efternavnets første bogstav også ens (fx Mette Jensen og Mette Jørgensen): udvid med flere bogstaver, indtil navnene er entydige ("Mette Je", "Mette Jø").
- Sammenligningsgrundlaget er hele medarbejderlisten for den valgte afdeling, så et navn ikke skifter, blot fordi en person ikke er på skærmen i dag.

## Hvor det slår igennem

Alle steder, hvor der i dag kun vises fornavn:
- Planner: ikke-tildelte ressourcer (medarbejderchips, ferie/kursus/vagt-lister).
- Planner: kompakt opgaverække, hvor tildelte medarbejdere vises som fornavne.
- Øvrige steder, hvor `name.split(' ')[0]` bruges til visning, gennemgås og skiftes til den nye hjælpefunktion.

Steder der viser fulde navne (medarbejderlisten, dialoger, kioskvisning) ændres ikke.

## Teknisk

- Ny hjælpefunktion i `src/utils/people.ts`:
  - `getDisplayFirstName(fullName, allNames)` samt en memo-venlig `buildFirstNameResolver(allNames)` der returnerer en funktion `(fullName) => string`.
  - Ren streng-logik, ingen databaseændringer.
- Komponenter henter medarbejderlisten (allerede tilgængelig via `useEmployees`) og bygger resolveren i en `useMemo`.
- Berørte filer: `src/utils/people.ts`, `src/components/Planner/UnassignedResourcesSection.tsx`, `src/components/Planner/CompactAssignmentRow.tsx` (+ evt. andre fundne fornavns-visninger).
- `CHANGELOG.md` opdateres efter implementering.
