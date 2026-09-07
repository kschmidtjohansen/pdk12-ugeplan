# EmployeeSelector: afstand først, servicemedarbejdere først inden for samme afstand + ret igangværende fejl

## Mål (justeret efter brugerens afklaring)
Afstand til sagens adresse (postnummer/GPS via Haversine) er **stadig den primære sorteringsfaktor**. Servicemedarbejdere vises først **inden for hver afstandsgruppe** — dvs. blandt de nærtliggende (≤15 km) står servicemedarbejderne først, og blandt de øvrige står servicemedarbejderne også først.

## Sorteringsrækkefølge
1. Valgte medarbejdere øverst (uændret — eksisterende selected-first-logik bevares).
2. Medarbejdere inden for 15 km før dem udenfor (uændret tærskel).
3. Inden for samme afstandsgruppe: servicemedarbejdere først (tjekker både `emp.role` og `emp.roles`).
4. Derefter: stigende afstand for nærtliggende, alfabetisk navn for øvrige.
5. Uden sagsadresse sorteres alfabetisk som i dag — rolle påvirker kun rækkefølgen, når afstand er aktiv.

## Først: ret to typefejl fra det afbrudte arbejde
1. `src/components/Planner/AssignmentDialogManager.tsx` (linje ~123): fjern dobbelt `employeesLoading`-attribut på `<AssignmentForm>` (behold én).
2. `src/components/Employees/EmployeeFormDialog.tsx` (linje ~420): tilføj manglende import `CalendarPlus` fra `lucide-react`.

## Ændring af sortering
- Fil: `src/components/Planner/EmployeeSelector.tsx`, i `sortedEmployees` (useMemo omkring linje 75-95).
- Gendan den hidtidige logik med "ingen koordinater → alfabetisk liste" og indsæt rolle-prioritet som sorteringsnøgle EFTER afstandsgruppen men FØR den præcise afstand/navn:
  ```text
  hvis ingen koordinater → alfabetisk (som i dag)
  ellers:
    1. nær (≤15 km) før fjern
    2. servicemedarbejder før andre roller
    3. begge nære → korteste afstand først
    4. ellers alfabetisk navn
  ```
- Filtrering, låste medarbejdere, virtualisering, loading/tomtilstand og badges ændres ikke.

## Verifikation
- Typecheck (`bunx tsgo --noEmit`) uden fejl.
- Lokal preview svarer HTTP 200.
- Opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.

## Afventer stadig (allerede godkendt, fortsættes bagefter)
Vikar-forlængelse i `EmployeeFormDialog`: forlæng-knap, `min`-dato = seneste af i dag/nuværende udløbsdato, validering mod forkortelse samt da/en-oversættelser (`extendEmployment`, `expiryBeforeCurrent`). Delen er delvist skrevet og færdiggøres i samme arbejdsgang.
