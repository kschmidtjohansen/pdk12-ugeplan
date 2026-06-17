## Plan: Rediger/fjern kursus + opdatering af "Opdater"-bjælke

### 1. Kursus: rediger og fjern markering
**Problem:** Når Henrik tilføjes til kursus 11. maj–22. juni vises intet i ferieoversigten, og der findes ingen måde at redigere/slette på.

**Diagnose af den manglende visning:**
- `EmployeeTrainingDialog` inviterer querycachen `['training-grid']` korrekt, men `VacationGridOverview` kører kun forespørgslen når `selectedDepartmentId` er sat. Hvis afdelingen ikke matcher det `department_id`, der blev gemt (eller hvis trainings-RLS ikke giver brugeren SELECT i den valgte afdeling), kommer rækken ikke med.
- Verificér via `supabase--read_query` at den indsatte træning faktisk har `department_id = selectedDepartmentId` og at SELECT-policy på `trainings` returnerer rækken for den indloggede bruger. Hvis policy mangler, tilføj migration der giver admin/skadeleder + bruger selv læseadgang i deres afdeling.
- Sikr at `trainings` er tilføjet `supabase_realtime`-publikationen (ellers opdateres grid ikke automatisk efter insert/delete).

**Nyt UI – kursusadministration:**
- Udvid `EmployeeTrainingDialog.tsx` så den både opretter nye kurser og viser eksisterende:
  - Hent aktive/kommende kurser for `employee.id` (fra i dag og frem) ved åbning.
  - Liste med titel, datointerval og `Slet`-knap (skraldespand-ikon). Sletning kalder `supabase.from('trainings').delete().eq('id', ...)` og invaliderer `['training-grid']` + den lokale liste.
  - "Redigér" på en eksisterende række fylder formularens datoer/titel/noter og skifter knappen til `Opdatér kursus` (UPDATE i stedet for INSERT).
  - Behold "Tilføj nyt" som primær handling når intet er valgt.
- Dialogtitlen skifter til "Kurser for {navn}". Tilføj `Sheet`-lignende sektioner: "Aktive kurser" øverst, "Nyt kursus" nederst.

### 2. RealtimeChangeNotifier: afdelingsfiltreret + flyttes ned i højre hjørne
- Læs `selectedDepartmentId` fra `DepartmentContext` i `RealtimeChangeNotifier.tsx`.
- I `handleChange(payload)`: ignorér payload hvis `payload.new?.department_id` (eller `payload.old?.department_id` ved DELETE) er sat og forskellig fra den valgte afdeling. Tabeller uden `department_id` (fx `profiles`) beholder eksisterende adfærd.
- Skift containeren fra fuldbredde topbjælke til kompakt toast nederst til højre:
  - `fixed bottom-4 right-4 z-40 max-w-xs` med `rounded-xl shadow-lg border bg-card text-card-foreground p-3`.
  - Mindre tekst, ikon + "Opdatér"-knap + luk-kryds i samme række.
  - Bevar `animate-fade-in`.
- Ingen ændringer i debounce/own-action-logik.

### 3. Dokumentation
- `CHANGELOG.md`: ny entry under dagens dato med to bullets (kursusredigering/-sletning, ny notifier-placering + afdelingsfilter).
- `docs/implementation-plan/tasks.md`: marker relevante opgaver som `[x]` hvis de findes; ellers tilføj nye linjer under "Ferie/Kursus".

### Tekniske detaljer
- Filer ændres: `src/components/Employees/EmployeeTrainingDialog.tsx`, `src/components/shared/RealtimeChangeNotifier.tsx`, `CHANGELOG.md`, `docs/implementation-plan/tasks.md`.
- Evt. migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.trainings;` + tilføj manglende SELECT-policy hvis verifikation viser hul. Ingen skemaændringer ud over det.
- Query keys: bevar `['training-grid']`; tilføj `['trainings-for-employee', employeeId]` i dialogen.
- Ingen ændringer i `VacationGridOverview` ud over at den allerede lytter via `qc.invalidateQueries`.
