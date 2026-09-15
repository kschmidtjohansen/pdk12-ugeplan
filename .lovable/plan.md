# Sygemelding: fravær synligt på dashboard og i ugeplanen

## Status i dag (verificeret)

- Sygemelding gemmes pr. dato i `sick_days` (én række = én dag). Anders er derfor automatisk rask dagen efter — det kræver ingen ny backend-løsning.
- `EmployeeSelector` filtrerer/låser allerede syge for den valgte dag, og "Ikke tildelte ressourcer" viser dem som fraværende (kun admin/skadeleder ser årsagen).
- Mangler: dashboardets fraværstal/liste tæller ikke syge med (de fjernes blot fra "ledige"), og dagens fraværsrække i ugeplanen viser kun ferie.

## Det jeg laver

1. **Dashboard** — syge for den valgte dag tælles med i "Fraværende" og vises i fraværslisten/modalen. Admin og skadeleder ser "Syg", alle andre ser blot "Fraværende" uden årsag.
2. **Ugeplan** — dagens fraværsrække udvides med syge medarbejdere for netop den dag, med samme rollestyrede tekst.
3. **Oprydning i baggrunden** — gamle sygedage ryddes automatisk med det eksisterende natlige oprydningsjob, så tabellen ikke vokser.

## Teknisk

- `useDashboardMetrics.ts`: brug `useSickForDateValue(metricDateStr)` (allerede importeret) til at tilføje syge til `absentRaw`/`absentEmployeesList` med et `isSick`-flag og en `absenceLabel` afledt af `canSeeSickReason`. Undgå dubletter via `absentSeen`.
- `AbsentEmployeesModal.tsx` / KPI-visning: vis badge "Syg" vs. "Fraværende" ud fra flaget; brug soft-status tokens (`destructive-soft` / `warning-soft`), ingen hardcodede farver.
- `DayAbsenceRow.tsx`: tilføj `useSickForDateValue(dateKey)` + `useEmployees` og render syge som ekstra chips i samme række med rollestyret tooltip-tekst.
- Nye oversættelsesnøgler i `src/translations/da|en/{planner,dashboard}.ts` (fx `sickLabel`, `absentLabel`) — ingen hardcoded dansk tekst i komponenterne.
- Migration: udvid `cleanup_log_retention()` med sletning af `sick_days` ældre end 365 dage (batch), `SECURITY DEFINER`, `SET search_path = ''`, revoke fra PUBLIC/anon/authenticated.
- Afslut med `npx tsgo --noEmit -p tsconfig.json` samt opdatering af `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.
