# Udløbne vikarer må ikke kunne bookes efter udløbsdatoen

## Hvad jeg har bekræftet

Anders Axelsen er oprettet som vikar med udløb **27. september 2026** (bekræftet i databasen: `is_temporary = true`, udløb sat).

Udløbskontrollen findes i dag **kun** ét sted: medarbejdervælgeren i opgaveformularen (`EmployeeSelector`). Alle andre steder i ugeplanen kender ikke til udløbsdatoen:

- **Ikke-tildelte ressourcer** henter sin medarbejderliste fra et andet datalag, hvor felterne "vikar" og "udløbsdato" slet ikke hentes med. Derfor står Anders som ledig på alle datoer — også efter den 27.
- **Masse-tildeling** ("tildel medarbejder til X opgaver") viser hele medarbejderlisten uden nogen form for udløbs- eller fraværskontrol.
- **Postnummer-/nærhedssøgningen** i ugeplanen tager heller ikke højde for udløb.
- Der er **ingen spærring i databasen**, så en tildeling kan gemmes selvom vikaren er udløbet.

## Løsningen

1. **Én fælles regel for udløb.** Udløb vurderes altid mod *opgavens dato*, ikke mod dagens dato. Udløbsdagen selv tæller stadig som en gyldig arbejdsdag (Anders kan bookes til og med 27. september).
2. **Ikke-tildelte ressourcer:** vikarer, der er udløbet på den valgte dag, forsvinder fra "ledige" grupperne og vises i stedet i fraværslisten med forklaringen "Midlertidig adgang er udløbet". Datalaget udvides, så vikar-status og udløbsdato følger med medarbejderne her.
3. **Masse-tildeling:** udløbne vikarer kan ikke vælges — de vises låst med samme forklaring.
4. **Nærhedssøgning på postnummer:** udløbne vikarer indgår ikke i resultatet for dage efter udløbet.
5. **Medarbejdervælgeren** beholder sin nuværende kontrol, men bruger den fælles regel, så alle steder opfører sig ens.
6. **Sikkerhedsnet i databasen:** en valideringstrigger afviser, at en udløbet vikar bliver knyttet til en opgave med en dato efter udløbet — uanset hvilken vej i brugerfladen tildelingen kommer fra. Eksisterende tildelinger røres ikke.

## Teknisk

- Ny fælles hjælper `isTemporaryExpiredOn(employee, date)` i `src/utils/employeeAvailability.ts`; `EmployeeSelector.tsx` bruger den i stedet for sin lokale `isExpiredOn`.
- `src/services/data/unifiedDataService.ts`: profil-select udvides med `is_temporary, expires_at` (og felterne mappes videre), så `PlannerContent`/`UnassignedResourcesSection` har data. Cache-nøgler og afdelingsfiltrering ændres ikke.
- `UnassignedResourcesSection.tsx`: udløbne vikarer filtreres ud af `categorizedByRole` og `stats`, og tilføjes til `absentEmployees` med låseforklaring `employees.lockedReasonExpired`.
- `BulkAssignEmployeeDialog.tsx`: bruger den fælles hjælper mod opgavernes datoer og deaktiverer knappen for udløbne vikarer.
- `useProximitySearch.ts`: udelukker udløbne vikarer pr. dag, på samme måde som kursus-/sygdomsfiltreringen.
- Migration: `BEFORE INSERT OR UPDATE`-trigger på `assignments_employees`, der slår opgavens dato op og rejser en fejl, hvis brugeren er en vikar med udløb før den dato. Funktionen skrives `SECURITY DEFINER` med `SET search_path = ''` jf. projektets sikkerhedskrav. Ingen ændringer i RLS-politikker eller grants.
- Ingen ændringer i rettigheder, afdelingsisolation eller eksisterende data.

Verifikation: typetjek og kodetjek, kontrol i ugeplanen på en dag før, på og efter 27. september (både ikke-tildelte ressourcer og opgaveformularen). `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres til sidst.
