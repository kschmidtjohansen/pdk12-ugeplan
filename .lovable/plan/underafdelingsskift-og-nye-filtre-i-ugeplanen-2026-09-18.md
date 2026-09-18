# Underafdelingsskift og nye filtre i Ugeplanen

## 1. Skift underafdeling direkte i Ugeplanen

Den samme pille-række som på Dashboard placeres øverst i /planner, lige under overskriften: "Underafdeling: Alle | Fugt | …". Et klik skifter med det samme, uden at gå via Dashboard, og valget følger med til resten af systemet som i dag. Rækken vises kun, hvis du har adgang til mere end én underafdeling, og "Alle" er som hidtil kun for administratorer.

## 2. Nyt filterpanel i Ugeplanen

En sammenklappelig filterlinje over dagslisten med to værktøjer. Den er tilgængelig i alle underafdelinger, og aktive filtre vises som chips, der kan ryddes med ét klik.

### Postnummer-søgning (hvem er tættest på?)

- Indtast et postnummer (fx 3400 Hillerød). Systemet slår postnummerets midtpunkt op.
- Resultatet er en liste over medarbejdere i den valgte afdeling/underafdeling, sorteret efter korteste afstand, med:
  - afstand fra medarbejderens hjemadresse,
  - afstand fra den opgave vedkommende er på den pågældende dag (når opgaven har en kendt adresse),
  - den korteste af de to bruges til sorteringen, og det fremgår hvilken det er.
- Beregningen laves for hver dag i den viste uge: for hver dag ses hvornår personen er fri (sluttidspunkt for sidste opgave den dag) eller om dagen er helt ledig, og om personen er fraværende.
- Medarbejdere, der er fraværende (ferie, kursus, sygdom) den pågældende dag, markeres som ikke tilgængelige og sorteres nederst.
- Listen er kun et opslagsværktøj — den ændrer ikke ugeplanen og tildeler ikke opgaver.

### Filtrering på navne

- Vælg én eller flere medarbejdere. Ugeplanen viser så kun opgaver i den viste uge, hvor mindst én af de valgte er tildelt.
- Ryd-knap og chips med de valgte navne; filteret gælder både standard-, kompakt- og gittervisning.

## Teknisk

- `src/pages/PlannerPage.tsx`: gengiver `SubDepartmentQuickSwitcher` (flyttes til `src/components/shared/`, eksisterende import på Dashboard opdateres) i headeren; ny state `selectedEmployeeIds: string[]` og `proximityOpen`; `sortedWeekAssignments` filtreres på `employees.includes(...)` før den sendes til `PlannerContent`.
- Ny `src/components/Planner/PlannerFilterBar.tsx`: rummer navnevælger (Popover + Command med multiselect, mønster fra `EmployeeSelector`) og postnummerfelt; chips for aktive filtre.
- Ny `src/components/Planner/ProximityPanel.tsx` + `src/hooks/useProximitySearch.ts`:
  - postnummer → koordinater via `fetchPostnrCoords` (DAWA-proxy), debounced og cachet i React Query pr. postnr.
  - afstande med `haversineDistanceKm` mod `profiles.lat/lng` (hjem) og `assignments.lat/lng` (dagens opgave, fra ugens allerede hentede assignments — ingen nye kald).
  - ledighed pr. dag: sidste `toTime` blandt dagens opgaver; fravær via eksisterende `useVacations`, `useActiveTrainings`, `useSickForDate`/`list_department_absent_user_ids`.
  - medarbejdere uden koordinater vises sidst med "adresse mangler".
- Ingen database- eller edge function-ændringer; alt bygger på eksisterende data og RLS.
- UI følger `/docs/ui-guidelines/`: kompakt SaaS-stil, semantiske tokens, responsiv (drawer på mobil, popover på desktop).
- Nye da/en-tekstnøgler under `planner.filters.*`.
- Efter opgaven: `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres.
