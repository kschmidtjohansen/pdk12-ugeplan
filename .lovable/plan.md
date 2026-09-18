# Medarbejdere mangler på opgaverne (f.eks. Ribevej)

## Hvad jeg har målt

- Ronnie Jensen og Henrik Jørgensen ER stadig koblet på Ribevej-opgaven i dag i databasen (begge aktive, ikke demo-data). Data mangler altså ikke — de bliver ikke hentet frem til skærmen.
- Den centrale databasefunktion, der henter opgaver med hold, blev i sidste uge udvidet med positionsfelterne (breddegrad/længdegrad). Funktionen erklærer dem som en anden taltype, end kolonnerne faktisk har. Postgres afviser derfor hele opkaldet med en typefejl.
- Når det opkald fejler, skifter appen til reserveløsningen. Den henter alle opgaver i afdelingen (1.898 stk. i afd. 12) og forsøger derefter at hente medarbejderne for alle opgave-id'er i én forespørgsel. En forespørgsel med knap 1.900 id'er bliver for stor og fejler, hvorefter listen over medarbejdere ender tom — opgaverne vises, men uden navne.

Det passer præcist med symptomet: opgaverne er der, holdet er væk, og det begyndte efter sidste uges ændring.

## Det jeg vil rette

1. **Databasefunktionen**: ret taltypen for breddegrad/længdegrad, så funktionen matcher kolonnerne og igen returnerer opgaver med hold. Signatur, felter og rettigheder bevares (systemrettigheder, afdelings- og underafdelingsfiltrering uændret).
2. **Reserveløsningen gøres robust**: hent kun opgaver i et fornuftigt tidsvindue i stedet for alle historiske opgaver, og hent medarbejderne i portioner (maks. 150 opgave-id'er pr. forespørgsel), så den aldrig igen fejler lydløst.
3. **Synlig fejl i stedet for tomme hold**: hvis medarbejderhentningen fejler, logges det tydeligt i udvikling, og navnene hentes via det eksisterende sikkerhedsnet i stedet for at blive tomme.
4. **Verifikation**: bekræft via databasen at funktionen nu kan kaldes uden fejl og returnerer hold for Ribevej-opgaverne denne uge, og kør typetjek.
5. **Dokumentation**: opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.

## Tekniske detaljer

- `public.list_accessible_assignments_with_team`: `RETURNS TABLE(... lat numeric, lng numeric)` mod `assignments.lat/lng double precision` → fejl 42804 "structure of query does not match function result type" ved `RETURN QUERY`. Rettes til `double precision` i returtypen (funktionen droppes og genskabes uændret i øvrigt: `SECURITY DEFINER`, `SET search_path TO ''`, `GRANT EXECUTE TO authenticated, service_role`).
- `OptimizedAssignmentService.fetchAssignmentEmployees`: chunk `.in('assignment_id', ...)` i blokke à 150 og saml resultaterne; returnér ikke `[]` ved delvis fejl.
- `fetchAssignmentsFallback`: begræns til et datointerval (f.eks. 90 dage tilbage og 180 dage frem) ud over afdelings-/underafdelingsfiltret.
- Den midlertidige DEV-diagnostik i `useOptimizedAssignments` beholdes indtil du har bekræftet, at navnene er tilbage.
