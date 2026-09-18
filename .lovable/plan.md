# Nærhed måles fra dagens sidste opgave

I dag rangerer listen efter den korteste afstand — det ender næsten altid med at være hjemadressen. Det ændres, så udgangspunktet er dér, medarbejderen faktisk befinder sig sidst på dagen.

## Sådan bliver det

For hver dag i ugen:
- Er medarbejderen booket den dag, måles afstanden fra **dagens sidste opgave** til det søgte postnummer.
- Er medarbejderen ikke booket den dag, måles afstanden fra **hjemadressen**.

Hver dagsbrik viser nu kort, hvor målingen kommer fra, og hvor langt der er:
- "on 13:30 · 1 t 30 m · 24 km · ca. 30 min" for en dag med opgaver (afstand fra sidste opgave)
- "Fri hele dagen (8 t) · 18 km · ca. 25 min" for en helt ledig dag (afstand fra hjem)
- Fraværende dage vises uændret, uden årsag

Øverst på hver medarbejder står den bedste dag: afstand, estimeret køretid og om det er fra en opgave eller fra hjemmet. Rækkefølgen bygger på den bedste dag blandt de dage, hvor der er mindst 1 time fri — er der ingen sådan dag, bruges den korteste afstand på tværs af ugen. Medarbejdere uden koordinater ligger fortsat nederst.

Under listen skrives, at køretiden er et skøn ud fra afstand.

## Teknisk

- `src/hooks/useProximitySearch.ts`:
  - `ProximityDayInfo` får `originDistanceKm`, `originTravelMin` og `origin: 'assignment' | 'home' | null`. `originDistanceKm` beregnes fra dagens sidste opgaves `lat/lng` (sorteret efter `toTime`; har den sidste opgave ingen koordinater, bruges den seneste opgave på dagen der har koordinater), ellers fra `profiles.lat/lng`.
  - `bestDistanceKm` / `bestTravelMin` / `bestSource` udledes nu af dagenes `originDistanceKm`: først blandt dage med `hasEnoughFree`, ellers blandt alle ikke-fraværende dage, ellers alle dage.
  - Sortering uændret i princippet: `hasEnoughFreeDay` → `hasAvailableDay` → `bestDistanceKm`.
  - Det eksisterende felt `assignmentDistanceKm` (korteste afstand til en vilkårlig opgave på dagen) fjernes, da det erstattes af `originDistanceKm`.
- `src/components/Planner/ProximityPanel.tsx`: dagsbrikkerne får afstand + estimeret køretid via `estimateTravelMinutes`/`formatKm`/`formatMinutes`; hoved-linjen viser den bedste dags afstand, køretid og kilde (opgave eller hjem) i stedet for de to separate Hjem/Opgave-mærkater.
- Nye/justerede tekstnøgler under `planner.filters.*` (da/en): `fromLastAssignment`, `fromHome`, `travelEstimateNote`; `distanceHome`/`distanceAssignment` genbruges som kildemærkater.
- Ingen database- eller edge function-ændringer. Efter implementering: typecheck, `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres.
