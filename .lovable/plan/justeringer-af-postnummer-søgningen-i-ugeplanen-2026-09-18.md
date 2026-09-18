# Justeringer af postnummer-søgningen i Ugeplanen

To ændringer af den nye nærhedsliste (postnummer-søgning) i Ugeplanen:

## 1. Kun hverdage — lørdag og søndag fjernes

Nærhedslisten viser i dag en status-brik for alle ugens syv dage. Lørdag og søndag fjernes helt fra beregningen:

- Brikkerne under hver medarbejder viser kun mandag–fredag.
- Afstanden til "dagens opgave" og "hvornår de er fri" måles kun på hverdage — weekendopgaver tæller ikke længere med i sorteringen.
- Redigering i `src/hooks/useProximitySearch.ts`: ugens dage filtreres til mandag–fredag, før dagsinfo og afstande beregnes.

## 2. Kun fugtteknikere i Fugt-underafdelingen

Når den valgte underafdeling er **Fugt**, viser nærhedslisten kun medarbejdere med rollen **fugttekniker** — andre roller filtreres fra resultatet.

- Underafdelingen genkendes via navnet på den valgte underafdeling (`userSubDepartments` fra afdelingskonteksten, case-insensitivt match på "fugt").
- Medarbejderens roller tjekkes via både `roles`-listen og det primære `role`-felt.
- I alle andre underafdelinger (og under "Alle") fungerer søgningen uændret med alle medarbejdere.
- Navnefilteret (valg af enkelte navne) er ikke en del af postnummer-søgningen og ændres ikke.

## Tekniske detaljer

- `src/hooks/useProximitySearch.ts`: `weekDays` filtreres til `getDay() >= 1 && getDay() <= 5`; `employees` forfiltreres på fugttekniker-rollen, når underafdelingen er Fugt.
- `src/components/Planner/PlannerFilterBar.tsx`: finder den valgte underafdelings navn via `useDepartment()` og sender det videre til panelet/hooken.
- `src/components/Planner/ProximityPanel.tsx`: ingen strukturelle ændringer — listen og brikkerne gengiver bare det filtrerede resultat.
- Ingen database- eller edge function-ændringer.
- Kvalitetstjek: `npx tsgo --noEmit -p tsconfig.json`.
- Efterfølgende opdateres `CHANGELOG.md` og `docs/implementation-plan/tasks.md` jf. dokumentationsprotokollen.
