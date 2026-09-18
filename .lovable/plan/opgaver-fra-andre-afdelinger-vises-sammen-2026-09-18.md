# Opgaver fra andre afdelinger vises sammen

Ugeplanen viser lige nu opgaver på tværs af afdelinger (fx Ringsted-sager i Struer). Nedenfor er det, jeg har kunnet bekræfte i koden og databasen, og hvad der skal rettes.

## Hvad jeg har bekræftet

- Hovedhentningen af ugeplanens opgaver sender korrekt den valgte afdeling med.
- Men hvis den hentning fejler, skifter systemet automatisk til en reserveløsning, der **henter alle opgaver uden afdelingsfilter**. Det giver præcis det billede, du ser.
- En anden hentning (bruges bl.a. af "Mine opgaver" og medarbejder-dashboardet) kalder datakilden med **afdeling = ingen**, dvs. alle afdelinger.
- I sidste uges ændring blev den centrale databasefunktion sat til at køre med brugerens egne rettigheder i stedet for systemets. Det passer med, at konsollen nu skriver "Responsible user not found" — navne på ansvarlige kan ikke længere slås op. Det er en regression fra samme ændring og skal rulles tilbage (koordinaterne beholdes).
- 44 opgaver i den aktuelle periode står helt uden afdeling i databasen. De hører ikke hjemme nogen steder og dukker op i de ufiltrerede veje.

## Det jeg vil gøre

1. **Rul databasefunktionen tilbage til systemrettigheder** (som før), men behold `lat`/`lng` og underafdeling i svaret. Så virker navneopslag og afdelingsfiltrering igen som tidligere.
2. **Reserveløsningen skal filtrere på afdeling og underafdeling** i stedet for at hente alt. Kan afdelingen ikke afgøres, returneres ingenting frem for alt.
3. **Ret den ufiltrerede hentning**, så den altid får den valgte afdeling og underafdeling med — inkl. cache-nøgler, så data ikke genbruges på tværs af afdelinger.
4. **Ryd cache ved afdelingsskift**, så gamle resultater ikke hænger ved.
5. **Diagnose-log (kun i udvikling):** hvis der returneres en opgave, hvis afdeling ikke matcher den valgte, logges det tydeligt. Det fanger fremtidige lækager med det samme.
6. **De 44 opgaver uden afdeling** rører jeg ikke uden din accept — sig til, om de skal tilknyttes en afdeling, og hvilken.

## Teknisk

- `supabase/migrations`: ny migration som genskaber `list_accessible_assignments_with_team` med `SECURITY DEFINER` + `SET search_path TO ''`, uændret signatur (`sub_department_id`, `lat`, `lng` bevares), grants til `authenticated`/`service_role`.
- `src/services/optimizedAssignmentService.ts`: `fetchAssignmentsFallback(role, departmentId, subDepartmentId)` — `.eq('department_id', …)` og `.eq('sub_department_id', …)`; kald opdateres i `fetchAllAssignments`; returnér `[]` hvis `departmentId` mangler (ikke demo).
- `src/services/enhancedDataFetching.ts`: `fetchAssignmentsEnhanced(currentUserEmail, departmentId, subDepartmentId)` sender parametrene til RPC'en og inkluderer dem i `getCacheKey`.
- `src/services/enhancedUnifiedDataService.ts`, `src/hooks/useEnhancedUnifiedData.ts`, `src/hooks/assignment/useAssignmentDataOptimized.ts`: viderefører `selectedDepartmentId`/`selectedSubDepartmentId` fra `useDepartment()`; fetch og realtime-refetch afhænger af dem.
- DEV-guardet advarsel i `fetchAssignmentsForQuery`, hvis en opgaves afdeling ≠ valgt afdeling.
- Efter opgaven: `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres.
