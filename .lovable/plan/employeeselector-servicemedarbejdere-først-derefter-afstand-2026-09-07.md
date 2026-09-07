# EmployeeSelector: servicemedarbejdere først, derefter afstand

## Mål
Sorter listen i medarbejdervælgeren så **servicemedarbejdere altid vises først**. Inden for hver rollegruppe sorteres stadig efter afstand til sagens adresse (postnummer/GPS via Haversine), som i dag.

## Ny sorteringsrækkefølge
1. Valgte medarbejdere øverst (uændret — eksisterende selected-first-logik bevares).
2. Servicemedarbejdere før andre roller.
3. Inden for samme rolle: medarbejdere inden for 15 km først, sorteret stigende efter afstand.
4. Medarbejdere uden afstand/koordinater sorteres alfabetisk efter navn.
5. Når der ikke er valgt en sagsadresse (ingen koordinater), sorteres servicemedarbejdere først, derefter alfabetisk.

## Tekniske detaljer
- Fil: `src/components/Planner/EmployeeSelector.tsx`.
- I `sortedEmployees` (useMemo omkring linje 76-90): tilføj en rolle-prioritet som første sorteringsnøgle — `servicemedarbejder` får prioritet 0, alle andre roller 1. Bemærk at en medarbejder kan have flere roller (`emp.roles`): medarbejderen tæller som servicemedarbejder, hvis rollen findes i enten `emp.role` eller `emp.roles`.
- Eksisterende afstandslogik (15 km-tærskel, `haversineDistanceKm`, `top3NearbyIds`) ændres ikke — den bruges som anden sorteringsnøgle.
- Filtrering (søgning, låste/fraværende medarbejdere), virtualisering, loading/tomtilstand og badges ændres ikke.
- Ingen nye oversættelser, ingen databaseændringer.

## Verifikation
- Typecheck (`bunx tsgo --noEmit`) uden fejl.
- Lokal preview svarer HTTP 200.
- Opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.
