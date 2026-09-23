# Slet underafdeling med tydelig bekræftelse i stedet for fejlbesked

## Problemet

I dag tjekker systemet, om en underafdeling har tilknyttede brugere eller opgaver. Hvis den har, afvises sletningen med den røde besked "Kan ikke slettes – har tilknyttede brugere eller data", og man kommer ikke videre.

## Løsningen

Den blokerende fejlbesked fjernes. Når man trykker på skraldespanden, åbner en bekræftelsesdialog, der tæller op, hvad der bliver berørt:

- **Opgaver** — antal opgaver, der ligger i underafdelingen
- **Brugere** — antal brugere, der har adgang til netop denne underafdeling
- **Biler** — antal biler, der er koblet til underafdelingen
- Derudover: vagter, ferie/fravær, kurser og lagerposter, hvis der er nogen

Teksten forklarer i klar tale, at disse ting **ikke slettes** — de bliver blot flyttet ud af underafdelingen og ligger derefter under hovedafdelingen. Underafdelingen selv slettes.

Har underafdelingen ingen tilknytninger, vises en kort, rolig tekst om, at der ikke er noget tilknyttet.

Knappen hedder fortsat "Slet" (rød) med "Annullér" ved siden af, og den låses med "Sletter…" mens det kører. Tællingen hentes, når dialogen åbnes; indtil tallene er hentet, vises en kort indlæsningstekst, og sletteknappen er deaktiveret.

Til sidst en kvittering: "Underafdelingen er slettet" — og listen opdateres.

## Teknisk

Alt sker i `src/components/Admin/SubDepartmentManagement.tsx` plus oversættelser:

1. `handleDeleteAttempt` returnerer ikke længere tidligt med en fejl-toast. I stedet sættes `deleteTarget`, og der hentes tællinger (`head: true, count: 'exact'`) for `sub_department_id` på: `assignments`, `user_access`, `cars`, `on_call_duties`, `vacations`, `trainings`, `warehouse_items`, samt `car_sub_departments` (koblingstabellen).
2. Ny state `deleteCounts` + `countsLoading`; `AlertDialog` viser en punktopstilling med de tal, der er større end 0.
3. `handleDelete` løsner referencerne før sletningen (sæt `sub_department_id = null` på `assignments`, `cars`, `user_access`, `on_call_duties`, `vacations`, `trainings`, `warehouse_items`) og fjerner rækkerne i `car_sub_departments` for underafdelingen. Derefter slettes rækken i `sub_departments`. Fejler et trin, vises fejlbeskeden, og sletningen afbrydes.
4. Nøglen `admin.subDepartments.hasData` erstattes af nye nøgler i `src/translations/da/admin.ts` og `src/translations/en/admin.ts`: overskrift, forklarende brødtekst, labels for opgaver/brugere/biler/vagter/ferie/kurser/lager, "ingen tilknytninger" og "Sletter…".

Ingen databaseændringer, ingen ændring i rettigheder eller RLS. Verifikation: typetjek, kodetjek og kontrol af dialogen på både mobil- og desktopbredde. `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres til sidst.
