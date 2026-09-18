# Manglende medarbejdernavne i ugeplanen (afd. 12)

## Hvad jeg har kontrolleret

- Databasen er sund: for afdeling 12 i denne uge er der 43 opgaver, hvoraf 39 har medarbejdere tilknyttet.
- Den funktion, ugeplanen henter opgaver med, leverer stadig holdet (navn og e-mail) sammen med hver opgave, og den kører med systemrettigheder som før.
- Der findes kun én udgave af funktionen, og rettighederne til den er korrekte.
- Koden fra databasen og hele vejen til opgavekortet mapper holdet med de rigtige felter.

Derfor kan jeg ikke ud fra koden alene udpege årsagen. Fejlen sker i browseren, og jeg kan ikke logge ind i appen for at se det selv. Planen starter derfor med en kontrolleret måling i din egen browser.

## Plan

### 1. Find årsagen med en midlertidig måling
Tilføj en kortvarig, udviklingsvenlig log i ugeplanens datahentning, der viser:
- hvor mange opgaver der kom retur, og hvor mange af dem der har et hold med
- om hentningen brugte hovedvejen eller reservevejen
- hvor mange medarbejdere der findes i medarbejderlisten på samme tidspunkt

Du åbner ugeplanen én gang, og jeg læser resultatet. Det afgør, om navnene forsvinder ved hentningen, ved sammensætningen eller først ved visningen.

### 2. Gør navnevisningen robust (uafhængigt af årsagen)
Uanset måleresultatet indføres to sikkerhedsnet:
- Hvis en opgave kommer hjem med medarbejder-id'er, men uden navne, slås navnene op direkte, så kortet aldrig står tomt.
- Navne må ikke kunne bortfiltreres, blot fordi medarbejderen ikke ligger i den valgte afdelings medarbejderliste (f.eks. udlånte kolleger fra en anden afdeling).

### 3. Ret den egentlige årsag
Når målingen peger på det konkrete sted, rettes det der — og ikke kun symptomet. Afdelingsfiltreringen fra sidste rettelse bevares uændret: Ringsted-opgaver må fortsat ikke kunne ses i Struer.

### 4. Verifikation og dokumentation
- Typetjek køres rent.
- Kontrol af, at opgaver fortsat kun vises for den valgte afdeling og underafdeling.
- `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres.

## Teknisk

- Måling i `fetchAssignmentsForQuery` (`src/hooks/useOptimizedAssignments.ts`) og i `OptimizedAssignmentService.fetchAllAssignments` (hoved- kontra fallback-vej), kun bag `import.meta.env.DEV`.
- Sikkerhedsnet i `convertToAssignment`: hvis `assignment_employees` er tom, men `employees`-id'er findes, hentes `profiles` (id, name, email) i én samlet forespørgsel pr. hentning.
- `resolveEmployeeDisplayName`/`filterDisplayNames` (`src/utils/people.ts`): navne fra RPC'ens `team` skal have forrang, så en tom eller afdelingsfiltreret medarbejderliste ikke kan reducere et navn til "Unknown User".
- Ingen ændringer i `list_accessible_assignments_with_team`, medmindre målingen viser, at `team` faktisk kommer tom hjem.
