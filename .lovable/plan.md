
Jeg har fundet den konkrete årsag:

1) `useLocations` læser kun fra `department_settings` (`setting_key='locations'`).
2) I databasen findes der aktuelt **ingen** `locations`-rækker i `department_settings`.
3) Afdeling 12 har stadig `hall`-værdier på lagerposter (`sort_hal`, `hal_1`), men fordi settings-rækken mangler, viser formularen “ingen lokationer”.

Plan for fix (så det virker i alle afdelinger):

1. Opdater `src/hooks/warehouse/useLocations.ts`
- Tilføj robust parsing af `setting_value` (håndter både string/JSON og ældre formater).
- Hvis `department_settings` er tom for en afdeling: fallback til `warehouse_items` (unikke `hall`-værdier for valgt afdeling) og byg lokationsliste derfra.
- Behold streng afdelings-isolering (`eq('department_id', selectedDepartmentId)`), i tråd med knowledge.

2. Opdater `src/components/Admin/LocationManagement.tsx`
- Erstat nuværende “check-then-update/insert” med én `upsert(..., { onConflict: 'department_id,setting_key' })`.
- Fjern “silent failure”: vis fejl-toast ved save-fejl og rollback lokal state ved fejl.
- Brug samme parse-normalisering som i hooken, så admin-visning og lager-formular altid er konsistente.

3. Tilføj engangs-backfill af eksisterende data
- SQL-migration: opret `department_settings`-rækker for afdelinger, der har `warehouse_items.hall`, men mangler `locations`.
- Generér labels fra keys (`sort_hal` -> `Sort Hal`, `hal_1` -> `Hal 1`), så afdeling 12 virker med det samme uden manuel genoprettelse.

4. UI/tekst-fix
- Tilføj manglende oversættelsesnøgle `warehouse.noLocations` i `src/translations/da/warehouse.ts` og `src/translations/en/warehouse.ts`, så brugeren ikke ser rå nøgletekst.

Tekniske detaljer
- Fallback-query i hook:
  - `select hall from warehouse_items`
  - `eq('department_id', departmentId)`
  - `not('hall', 'is', null)`
  - dedupliker og map til `{ key, label }`.
- Parse-normalisering accepterer:
  - `[{ key, label }]` (nyt format)
  - `[{ id, name }]` (ældre format)
  - `["hal_1","sort_hal"]` (string-array)
- Backfill køres kun for manglende `locations`-settings, så eksisterende korrekte konfigurationer ikke overskrives.

Forventet resultat
- I afdeling 12 kan du vælge **Sort Hal** og **Hal 1** i lager-dialogen.
- Samme mekanik virker i alle afdelinger, også hvor data delvist ligger i historiske formater.
