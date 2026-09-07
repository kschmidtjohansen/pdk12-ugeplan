# Låseforklaring i medarbejdervælgeren

## Hvad bygger vi
Når en medarbejder er låst i `EmployeeSelector`, skal det fremgå tydeligt, hvorfor de ikke kan vælges — både på desktop og mobil.

## Ændringer
1. **Låseårsag udledes i `src/components/Planner/EmployeeSelector.tsx`:**
   - En samlet funktion returnerer den konkrete årsag for en låst medarbejder, i prioriteret rækkefølge:
     - Ferie (heldag)
     - Fraværende (manuelt sat på orlov)
     - Kursus
     - Fuldt booket (8+ timer den dag) — inkl. antal bookede timer fra `availabilityInfo`
     - Midlertidig adgang udløbet
     - Afsluttet / inaktiv

2. **Visning:**
   - **Desktop:** `Tooltip` (shadcn) omkring den låste række — ved hover vises forklaringen, fx *"Fuldt booket (8,0 t) – kan ikke vælges til flere opgaver denne dag"*.
   - **Mobil + desktop:** Da tooltips ikke virker på touch, vises årsagen også som en lille nedtonet tekst under medarbejderens navn på låste rækker (samme tekst som tooltip'en). Det dækker begge visninger uden ekstra interaktion.
   - Låste rækker forbliver klikbare visuelt (opacity nedsat), men uden toggle — uændret adfærd.

3. **Oversættelser:** Nye nøgler tilføjes under `employees.*` i da/en-oversættelserne, fx:
   - `employees.lockedReasonVacation`: "Har ferie denne dag"
   - `employees.lockedReasonOnLeave`: "Markeret som fraværende"
   - `employees.lockedReasonTraining`: "På kursus denne dag"
   - `employees.lockedReasonFullyBooked`: "Fuldt booket ({{hours}} t) – kan ikke vælges"
   - `employees.lockedReasonExpired`: "Midlertidig adgang udløbet"
   - `employees.lockedReasonTerminated` / `employees.lockedReasonInactive`

## Verifikation
- Typecheck (`tsgo --noEmit`).
- Browser-tjek på desktop (tooltip ved hover) og mobilvisning (inline-tekst).
- Opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.

## Tekniske detaljer
- Genbruger eksisterende `getEmployeeAvailabilityStatus`/`getEmployeeVacationStatus` og `useActiveTrainingsForDate` — ingen ny datahentning.
- Tooltip wrapper kun låste rækker; ulåste rækker påvirkes ikke.
