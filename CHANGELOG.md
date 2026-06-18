# Changelog

## 2026-06-18 — Kursus i fraværende-metric og Ikke-tildelte ressourcer

- Dashboardets "Fraværende"-metric inkluderer nu altid medarbejdere på kursus (også når rolle-filteret normalt ville udelade dem), så Henrik m.fl. fremgår med gul "Kursus"-label.
- Ny "Medarbejdere på Kursus"-sektion i Ikke-tildelte Ressourcer (Planner) med gul label og tooltip med kursustitel og slutdato.
- Tekst i Ikke-tildelte Ressourcer ændret: "Medarbejdere på Ferie" → "Medarbejdere fraværende".


## 2026-06-18 — Kursus-label i dashboard metrics-dialoger

- Dashboardets medarbejder-metrics bruger nu den valgte KPI-dato til kursus-tjek, så medarbejdere på kursus fjernes fra "Tilgængelige" og vises under "Fraværende".
- Fraværs-dialogen viser nu en gul "Kursus"-label og kursusdetalje for medarbejdere på aktivt kursus.

## 2026-06-17 — Kursus blokerer tildeling og tæller som ikke-tilgængelig

- Medarbejdere på aktivt kursus tæller ikke længere som tilgængelige i dashboard-metrics (lægges i "Fraværende").
- Ikke-tildelte ressourcer i Planner ekskluderer nu medarbejdere på kursus for den valgte dato.
- Medarbejder-vælger (Planner-tildeling) deaktiverer kursus-medarbejdere og viser en gul "Kursus"-label.
- Vagt-vælger (Skadelederv./Kørevagt) deaktiverer ligeledes medarbejdere på kursus med Kursus-label.


## 2026-06-17 — Kursus-status på medarbejderside

- Medarbejdere med aktivt kursus (dags dato inden for kursus-perioden) vises nu med gul "Kursus"-label i statuskolonnen i stedet for "Tilgængelig".
- De tælles desuden med under fanen "Fraværende" og fjernes fra "Tilgængelige".

## 2026-06-17 — Kursus redigering/sletning + kompakt opdater-notifier

- Kursus-dialog viser nu eksisterende kurser for medarbejderen med mulighed for at redigere eller slette.
- "Opdatér"-bjælken er flyttet fra topbar til en kompakt toast nederst til højre og filtreres nu på den valgte afdeling (ændringer i andre afdelinger udløser ikke længere notifikation).



## 2026-06-17 — Ferieoversigt udvidet: rolle-grupper, vagter, fravær og kursus

Ferieoversigten på `/vacation` er udvidet:
- Medarbejdere grupperes nu under Skadeleder / Fugttekniker / Servicemedarbejder med rolle-farver i venstre kant og gruppeoverskrifter.
- Grid fylder hele containerens bredde (`table-fixed` + `w-full`).
- Cellefarver: sort = ferie, gul = kursus, rød = fravær, blå = skadeledervagt, grøn = kørevagt.
- Ny "Kursus"-knap i medarbejderlisten (desktop + mobil) åbner dialog til at melde en medarbejder på kursus over en datoperiode.
- Ny tabel `public.trainings` med RLS (admin/skadeleder kan oprette/redigere; egne kursus-rækker er synlige for medarbejderen selv); realtime aktiveret.



## 2026-06-16 — Ferieoversigt flyttet fra Admin til /vacation

Ferieoversigt (kalender) er flyttet fra Admin-siden til ferie-siden som ny fane "Ferieoversigt". Synlig for Administrator, Skadeleder og IT Support (super_admin). Anmodnings-knapperne skjules når kalenderfanen er aktiv.


## 2026-06-16 — Skadeledere kan vælge "Alle" i sub-department-selector

Skadeledere blev tidligere låst på deres første tildelte underafdeling (fx Fugt) og kunne hverken se "Alle" i UserMenu/DepartmentSwitcherPill eller bytte mellem underafdelinger. Det betød at de — selv med korrekte skadeleder-rettigheder — ikke kunne oprette/redigere opgaver på hoveddepartementets niveau.

### Changes
- **`DepartmentContext.tsx`:** `isAdminLike` udvidet til også at omfatte `skadeleder`, så stored sub-dept-valg respekteres og default er NULL ("Alle") i stedet for auto-låst på første underafdeling.
- **`UserMenu.tsx` + `DepartmentSwitcherPill.tsx`:** "Alle"-rækken i sub-dept-radio-gruppen vises nu også for skadeledere.
- Ingen DB-ændringer; `user_access` styrer fortsat hvilke underafdelinger skadelederen kan se.



## 2026-06-12 — Cross-sub-department ledighed i planneren

Medarbejdere og biler bookede i én underafdeling (fx Fugt) fremstod stadig som "ledige" når man skiftede til "Alle" eller en anden underafdeling, fordi opgaverne for andre scopes ikke trækkes ind i visningen. Det er nu rettet uden at lække de fremmede opgaver ind i planneren.

### Changes
- **Ny RPC `list_cross_subdept_busy_resources`** (migration): returnerer optagne `employee_ids`/`car_ids` fra alle andre sub-department-scopes i samme hoveddepartment for en given dato-range. `SECURITY DEFINER`, `SET search_path = ''`, samme rolle-/published-logik som `list_accessible_assignments_with_team`.
- **Ny hook `useCrossSubDeptBusy.ts`:** kalder RPC'en for den aktuelle uge og returnerer `Set<string>` af optagne medarbejdere/biler per dato.
- **`PlannerContent.tsx`:** henter cross-busy og videregiver til `UnassignedResourcesSection`.
- **`UnassignedResourcesSection.tsx`:** filtrerer optagne medarbejdere/biler ud af "ledige"-listerne for den valgte dato. Selve opgavekortene fra fremmede underafdelinger vises stadig ikke (scope-isolation bevaret).


## 2026-06-11 — Underafdelings-vælger i opgave-dialog

Når man stod på en underafdeling (fx Fugt) blev nye opgaver automatisk tagget med den underafdelings `sub_department_id` — uden mulighed for at vælge "Alle" eller en anden sub-dept. Resultat: opgaver der skulle ligge på hoveddept ("Alle") blev låst fast på Fugt og dukkede op i Fugt-visningen.

### Changes
- **`AssignmentForm.tsx`:** ny "Underafdeling"-dropdown øverst i dialogen (vises kun når afdelingen har sub-depts). Indeholder "Alle" + alle aktive underafdelinger. Defaulter til aktuel sub-dept ved oprettelse, og til opgavens egen værdi ved redigering.
- **`useOptimizedAssignments.ts`:** `createAssignment` og `updateAssignment` bruger `data.subDepartmentId` (med fallback til `selectedSubDepartmentId`), så vælgerens valg respekteres.
- **`optimizedAssignmentService.ts` + `list_accessible_assignments_with_team` (migration):** RPC returnerer nu `sub_department_id` så dialogen kan prefille korrekt værdi ved redigering.
- **`types/assignment.ts`:** nyt felt `subDepartmentId` på `Assignment`.
- **Data-fix:** opgave `9d7de1bb-…` (12-00000) er nulstillet til `sub_department_id = NULL` så den fremover ligger korrekt under "Alle".


## 2026-06-11 — Fix: "Alle"-opgaver lækkede ind i underafdelings-visning

Planneren læser opgaver via RPC'en `list_accessible_assignments_with_team`. WHERE-klausulen indeholdt `OR a.sub_department_id IS NULL`, så opgaver knyttet til hovedafdelingen ("Alle") også dukkede op når man havde valgt en underafdeling. Filteret er nu strikt: underafdeling → kun matchende `sub_department_id`; ingen underafdeling → kun opgaver uden `sub_department_id`.

### Changes
- **`list_accessible_assignments_with_team`** (migration): begge rolle-grene bruger nu strikt sub_department_id-match uden NULL-fallback.


## 2026-06-11 — Fix: Rolle-redigering brugte direkte `user_roles` write

Admin-dialogen forsøgte at slette/indsætte rækker direkte i `user_roles` fra klienten ved rolleændring. Det ramte korrekt RLS-beskyttelse og gav `403 Forbidden`. Rolleændringer for eksisterende brugere går nu via `admin-user-role` edge function, og den direkte defensive rolle-write efter brugeroprettelse er fjernet.

### Changes
- **`src/components/Admin/UserManagement.tsx`:** `updateUserWithFallback` kalder nu `admin-user-role` med `roles[]`/`role` i stedet for direkte `user_roles` delete/insert.
- **`src/components/Admin/UserFormDialog.tsx`:** fjernet klient-side fallback write til `user_roles` efter oprettelse, fordi `admin-create-user` allerede gemmer roller via service-role.

## 2026-06-11 — Planner "Ikke-tildelte ressourcer" respekterer nu underafdeling

Sektionen "Ikke-tildelte ressourcer" viste tidligere alle medarbejdere, biler og opgaver fra hovedafdelingen, selvom man havde valgt en underafdeling (fx Fugt). Nu strikt filtreret efter de medarbejdere/biler/opgaver der er tilknyttet den valgte underafdeling.

### Changes
- **`src/services/data/unifiedDataService.ts`:** `fetchEmployees`, `fetchCars` og `fetchAssignments` accepterer nu `subDepartmentId`. Medarbejdere filtreres via `user_access.sub_department_id`, biler via `car_sub_departments`, opgaver via `assignments.sub_department_id`. Cache-key inkluderer sub-department.
- **`src/hooks/data/useUnifiedData.ts`:** sender `selectedSubDepartmentId` videre, lytter på `user_access`/`car_sub_departments` realtime, og refetcher når sub-departmentet skifter.



## 2026-06-11 — Strikt underafdelings-isolation for opgaver, biler og medarbejdere

Når en bruger vælger en underafdeling (f.eks. "Fugt"), vises **kun** data der eksplicit tilhører den underafdeling. Tidligere lækkede opgaver/biler uden `sub_department_id` ind i underafdelings-visningen, og medarbejdere blev slet ikke filtreret. Gælder alle roller, inkl. admin og super admin.

### Changes
- **Migration:** `list_accessible_assignments_with_team` fjerner `OR a.sub_department_id IS NULL` fallback — opgaver uden underafdelings-tilknytning er nu kun synlige i "Alle".
- **`src/services/carSecurityService.ts`:** strikt `.in('id', carIds)` filter via `car_sub_departments`. Tom liste ⇒ ingen biler vises i underafdelings-visningen (fjernet `OR sub_department_id IS NULL` og afdelings-fallback).
- **`src/hooks/employee/useEmployeeData.ts`:** filtrerer nu medarbejdere på `user_access.sub_department_id` når en underafdeling er valgt. Super_admins er kun synlige i hovedafdelings-visningen.
- **`EmployeeFormDialog` + form-state + actions:** nyt felt "Underafdeling" i medarbejder-redigering — gemmer til `user_access.sub_department_id` for den relevante afdelings-række.



## 2026-06-11 — Rod-årsag: fugttekniker så skadeledere som servicemedarbejdere i dashboard

`user_roles` SELECT-policy tillod kun, at brugeren læste sin egen rolle (medmindre vedkommende var admin/skadeleder). Det betød, at en fugttekniker (f.eks. Jonas Poulsen) fik tom rolle-info for alle kolleger, hvorefter `useEmployeeData` faldt tilbage til `'servicemedarbejder'` — så skadeledere og fugtteknikere blev fejlbehandlet som servicemedarbejdere i KPI'er og "Ledige medarbejdere"-dialogen.

### Changes
- Migration: udvider `user_roles_select_policy` til alle `authenticated` brugere, så rolle-baseret UI-filtrering virker korrekt for ikke-admins. Insert/update/delete er fortsat låst til `service_role`.


## 2026-06-11 — Fugttekniker ser kun servicemedarbejdere i "Ledige medarbejdere"-dialog

Dialogen filtreres nu også på rollen, så fugtteknikere (og servicemedarbejdere) ikke længere ser skadeleder/fugttekniker i listen — uanset om en underafdeling er valgt eller dato navigeres.

## 2026-06-11 — Fugttekniker ser kun ledige servicemedarbejdere i dashboard-KPI

### Changes
- `src/hooks/useDashboardMetrics.ts`: Når effektiv rolle er `fugttekniker` eller `servicemedarbejder`, begrænses tællbare medarbejdere altid til `servicemedarbejder` — også når en underafdeling er valgt. Admin/Skadeleder/IT Support uændret.

## 2026-06-11 — Fix: multi-role admin kunne ikke redigere roller + manglende oversættelse multiRoleHelp

### Changes
- `supabase/functions/admin-user-role/index.ts`: Admin-verifikation hentede kalderens rolle med `.maybeSingle()`, hvilket fejlede (PGRST116) hvis admin selv havde flere roller. Erstattet med multi-row query + `isAdminCaller` check.
- `src/translations/{da,en}/admin.ts`: Tilføjet manglende nøgle `userManagement.multiRoleHelp`.

## 2026-06-11 — Fugttekniker = Servicemedarbejder på Fridage, Skadeleder fuld vacation-adgang, "Super Admin" omdøbt til "IT Support"

### Changes
- `VacationPageContainer`: Fugttekniker behandles nu som Servicemedarbejder på `/vacation` (samme forenklede header/tabs). Skadeleder får fuld manage-adgang (godkend/afvis/rediger/slet + "Anmod for medarbejder") sammen med Administrator og IT Support via ny `canManageVacations`-flag.
- `VacationHeader`: "Anmod for medarbejder"-knap vises nu også for Skadeleder.
- Lager: bekræftet ingen ekstra rollegates ud over `canEdit` (super_admin/administrator/skadeleder). Fugttekniker har samme læse-visning som Servicemedarbejder.
- Oversættelser: rolle-label `super_admin` ændret fra "Super Admin" til "IT Support" i da/en for `admin.roles`, `common.roles` og `employees.roles`. Tilhørende `skipDepartmentNote` opdateret. Intern DB-/TS-rolle-nøgle `super_admin` er uændret.



## 2026-06-11 — Underafdelinger synlige fra første oprettelse + admin defaulter til "Alle"

### Changes
- `SubDepartmentQuickSwitcher`, `UserMenu` og `DepartmentSwitcherPill`: viser nu underafdelings-kontrol så snart der findes ≥1 underafdeling (tidligere krævede ≥2). Skjules stadig helt når der ingen er.
- `DepartmentContext.fetchSubDepartments`: administratorer og super_admins defaulter nu til "Alle" (`selectedSubDepartmentId = null`) hvis intet gyldigt valg er gemt i localStorage. Ikke-admins beholder auto-valg af første/eneste underafdeling.
- Resultat: Når der oprettes en ny underafdeling (fx "Fugt" i afdeling 12), bliver den straks synlig og skiftbar i dashboard quick-switcher, sidebar pill og UserMenu — uden at filtrere admin-visningen utilsigtet.



## 2026-06-11 — Manglende oversættelser i underafdeling-dialog

### Changes
- Tilføjet `admin.subDepartments.cars` og `admin.subDepartments.carsHelp` (da/en).
- Tilføjet `cars.title` (da: "Køretøjer", en: "Vehicles") så tællelabel på underafdelinger vises korrekt.


## 2026-06-11 — Mere luft mellem header og indhold i dialoger og cards

### Changes
- `DialogHeader`: øget `pb-3 mb-4` → `pb-4 mb-6` for bedre adskillelse mellem titel/beskrivelse og formularindhold.
- `CardHeader`: tilføjet `mb-2` og øget `pb-2` → `pb-3` for samme effekt på alle kort.


## 2026-06-11 — Multi-rolle på medarbejdere (oprettelse + redigering)

### Changes
- `EmployeeFormDialog`: rolle-Select erstattet med checkbox-gruppe så en medarbejder kan tildeles flere roller. Effektiv rolle (mest privilegerede) bestemmer adgangen.
- `useEmployeeFormState`: nyt `roles: UserRole[]` felt + `handleRoleToggle`. `role` udledes automatisk via `getEffectiveRole`.
- `useEmployeeActions.updateEmployee`: sender nu `roles[]` til `admin-user-role` (edge-function understøtter allerede arrays) ved rolleændring.
- `useEmployeeCreation`: efter oprettelse kaldes `admin-user-role` med fuld liste hvis >1 rolle valgt.
- `UnassignedResourcesSection`: kategorisering bruger `roles[]`, så en multi-rolle medarbejder vises i flere sektioner (fx både Skadeledere og Fugtteknikere).
- `EmployeesPage`: viderefører `handleRoleToggle` til dialogen.



## 2026-06-11 — Dashboard "Ledige medarbejdere" respekterer multi-rolle og underafdeling

### Changes
- `useEmployeeData`: aggregerer nu alle roller per bruger (`roles: string[]`) i stedet for kun den seneste; `role` sættes via `getEffectiveRole`.
- `Employee`-type: tilføjet valgfri `roles[]`.
- `useDashboardMetrics`: bruger `selectedSubDepartmentId` — uden sub-dept vises kun brugere med rolle `servicemedarbejder` (multi-rolle understøttet); med sub-dept vises også fugttekniker + skadeleder.
- `useEmployeeDialogData`: bruger `roles[]` ved navigation til andre datoer.



## 2026-06-11 — Scroll-fix på MultipleCarSelector popover

### Changes
- Popover begrænses nu af `--radix-popover-content-available-height` så lange bil-lister altid kan scrolles inden for viewporten (sidste biler var skåret af nederst i dialogboksen).



## 2026-06-11 — Rolle-farver på medarbejder-labels i opgavekort

### Changes
- `AssignmentDetails`: medarbejder-chips bruger nu kun rolle-farve (lilla=skadeleder, blå=fugttekniker, grøn=service/vikar) — `chip-person` fjernet så `getRoleBadgeClass` ikke overskygges.
- Prik i medarbejder-tooltip bruger nu `getRoleDotClass`.
- `CompactAssignmentRow`: medarbejder-chip i listevisning farves efter højest rangerede rolle blandt tilknyttede medarbejdere via `getEffectiveRole`.



## 2026-06-11 — Global ekstra top-padding mellem header og sideindhold

### Changes
- `AppShell`: tilføjet `pt-2 md:pt-4` på `<main>` for mere luft under topbaren på alle sider.



## 2026-06-11 — Multi-rolle, køretøjer i underafdeling, hurtig sub-dept switch, "Alle"-restriktion

### Changes
- **Multi-rolle pr. medarbejder**: brugere kan nu have flere roller samtidigt (fx både Skadeleder og Fugttekniker). Den højest-rangerede rolle bestemmer adgangsniveauet (`super_admin > administrator > skadeleder > fugttekniker > servicemedarbejder > vikar`).
  - DB-migration: fjerner UNIQUE-constraint `user_roles_user_id_unique`.
  - Ny utility `src/utils/roleHierarchy.ts` med `getEffectiveRole()` og `ROLE_RANK`.
  - `AuthContext`: henter alle roller; sætter `user.role` til primær (højeste) + ny `user.roles[]`.
  - `UserFormDialog`: rolle-Select erstattet af multi-checkbox; mindst én krævet.
  - Edge functions `admin-create-user` og `admin-user-role` accepterer nu `roles: string[]` (delete+insert), bagudkompatible med legacy `role`.
  - `UserManagement.updateUserWithFallback`: håndterer `roles`-array via delete+insert.
- **Køretøjer i underafdeling**: `SubDepartmentManagement` opret/rediger-dialog har nu også checkbox-liste over afdelingens køretøjer; gemmes via `car_sub_departments`. Listen viser et tæller-badge med antal tilknyttede køretøjer.
- **Dashboard hurtig sub-dept-switch**: ny komponent `SubDepartmentQuickSwitcher` vises på dashboardet (under WelcomeHeader) hvis brugeren har adgang til >1 underafdeling — horisontal pill-bar uden behov for at åbne UserMenu.
- **"Alle"-underafdeling restriktion**: `Alle`-valget i `UserMenu`, `DepartmentSwitcherPill` og `SubDepartmentQuickSwitcher` vises kun for Administrator + Super Admin. Andre roller kan kun vælge mellem de underafdelinger de er tilknyttet.



## 2026-06-11 — Fugttekniker-fixes & underafdelinger med roller

### Changes
- `useDashboardMetrics`: ledige/fraværende medarbejdere tæller nu kun rollen `servicemedarbejder` (vikar fjernet).
- `employeeAvailability`: en medarbejder markeres fuldt booket når seneste sluttid når lukketid (16:00 man-tor / 15:30 fre), uanset starttidspunkt — Mark 08:00–16:00 vises nu korrekt som fuldt booket.
- `sub_departments`: ny kolonne `visible_roles app_role[]` med default alle tre roller.
- `SubDepartmentManagement`: ny opret/rediger-dialog der spørger hvilke roller (Skadeleder, Fugttekniker, Servicemedarbejder) der skal vises i underafdelingen; valgte roller vises som badges på listen.
- `Dashboard/AssignmentDetailsDialog`: "Rediger"-knap er nu også gated på `canEdit` — fugtteknikere kan ikke længere redigere fra detaljedialogen.


## 2026-06-11 — Rolle-farver overalt

### Changes
- `UnassignedResourcesSection`: tre rolle-buckets med Skadeleder=lilla, Fugttekniker=blå, Servicemedarbejder=grøn.
- `EmployeeSelector` (planner): viser rolle-badge ved hver medarbejder i dropdown med samme farveskala.
- `AssignmentDetails`: medarbejder-chips er farvet efter rolle.
- Ny utility `src/utils/roleColors.ts` med centrale rolle-farver.



## 2026-06-11 — Rolle-badge farver

### Changes
- Rolle-badges har nu konsistente farver: Skadeleder=lilla, Fugttekniker=blå, Servicemedarbejder=grøn. Tilføjet `purple`-variant til `StatusBadge` og opdateret label-mapping for Fugttekniker.



## 2026-06-11 — Fugttekniker: justeringer

### Changes
- `useDashboardMetrics` tæller nu kun Servicemedarbejdere og Vikarer i "Tilgængelige" og "Fraværende" — Administratorer, Skadeledere og Fugtteknikere ekskluderet.
- Demo-rolleswitcher viser nu også Fugttekniker (mellem Skadeleder og Servicemedarbejder).
- Rollevælgeren i brugerformularen viser Fugttekniker over Servicemedarbejder.



## 2026-06-11 — Ny rolle: Fugttekniker

### Feature
- Tilføjet ny brugerrolle `fugttekniker` med samme rettigheder som Servicemedarbejder (kan ikke oprette/redigere opgaver, godkende ferie eller se brændstofkortkoder), men ser fuldt Skadeleder/Administrator-dashboard (DashboardCockpit med metrics og genveje til Medarbejdere/Biler). Rollen kan tildeles via brugerstyringen.



## 2026-06-10 — Servicemedarbejdere ser kolleger

### Fix
- Servicemedarbejdere og vikarer kan nu se alle kolleger under `/employees` for den valgte afdeling. RLS-policyen `secure_profile_access_unified` på `profiles` er udvidet med en check via `user_access`, så brugere ser kolleger der deler mindst én afdeling. Multi-tenant-isolation bevaret (ingen adgang på tværs af afdelinger).


## 2026-06-10 — Screen display: bilnummer foran navn

### UI
- Screen-display viser nu **bilnummer foran bilnavnet** (f.eks. "B01 - Berlingo").

## 2026-06-10 — Fix: Hjælpekøretøj-checkbox + offentlig skærmvisning

### Fix
- `Hjælpekøretøj`-checkboxen i biloprettelses-/redigeringsdialogen blev skubbet uden for det synlige område. Checkboxene står nu lodret stablet, så `Trækkrog`, `Vis i planlæggeren` og `Hjælpekøretøj` altid er synlige og klikbare.

### Feature
- `/screen-display` virker nu uden login (kioskbrug på ekstern skærm). Kræver stadig `?departmentId=...` i URL'en for at vise data. Underafdelinger og rotation virker også uden login.
- Skærmvisningen opdaterer nu **live** når der sker ændringer på opgaver, teammedlemmer eller fri — via Supabase realtime (1 s debounce). 5-minutters fallback bevaret.
- Skærmvisningen **skifter automatisk til ny dag ved midnat** (00:00), så kiosk-skærme følger med uden manuel indgriben.

### Backend
- Tre nye SECURITY DEFINER RPCs: `list_screen_display_assignments`, `list_screen_display_absences`, `list_screen_display_sub_departments` — alle med `EXECUTE` til `anon` + `authenticated`, scoped til en obligatorisk `p_department_id`.



## 2026-06-09 — Feature: auto-fjern medarbejder fra opgaver når fri godkendes

### Feature
- Ny edge function `vacation-cleanup-assignments` kaldes automatisk når en fri-anmodning godkendes.
- Sletter alle `assignments_employees`-rækker for medarbejderen i fri-perioden (også publicerede sager).
- Nulstiller `responsible_user_id` hvis medarbejderen står som skadeleder på en opgave i perioden.
- Halv-dags fri: kun opgaver med faktisk tidsoverlap berøres.
- Hver ændring logges i `planner_change_log` (`auto_unassign_vacation` / `auto_clear_responsible_vacation`) og vises i opgavens historik-tab.
- Berørte skadeledere modtager en aggregeret notifikation: *"{Navn} er fjernet fra X opgaver pga. godkendt fri."*
- Toast efter godkendelse inkluderer antal berørte opgaver.

## 2026-06-09 — Feature: VW Vejhjælp + hjælpekøretøjer (trailer/miljøvogn)

### Feature
- Ny knap **"VW Vejhjælp"** på Biler-siden ved siden af Falck Vejhjælp. Viser vagttelefon `80 20 30 80` (klikbar `tel:80203080`). Ingen abonnementsnummer.
- Ny `is_auxiliary`-kolonne på `cars`. Når sat på en bil:
  - Vises stadig på Biler-siden (med "Hjælpekøretøj"-badge på mobilkort).
  - Kan stadig vælges til opgaver i planneren.
  - **Skjules** fra "Tilgængelige biler" i `UnassignedResourcesSection`.
  - **Tælles ikke med** i dashboardets metric "Tilgængelige biler" (hverken tæller eller nævner).
- Felt redigeres via checkbox i `CarFormDialog` med tydelig hjælpetekst.

## 2026-06-08 — Fix: tydelig fejlbesked når email allerede findes ved brugeroprettelse

### Fix
- `admin-create-user` edge function returnerer nu HTTP 409 med dansk besked når en eksisterende auth-bruger forsøges oprettet igen (i stedet for generisk "Edge Function returned a non-2xx status code"). `UserFormDialog` læser nu også fejl-body fra `FunctionsHttpError.context`, så server-beskeden vises korrekt i toast og inline-fejl.



## 2026-06-04 — Security: demo-data lækkede via SECURITY DEFINER RPC

### Security
- `list_accessible_assignments_with_team` (SECURITY DEFINER) omgik RLS og returnerede demo-opgaver (fx sag "1221") til alle live-brugere i afd. 12, fordi funktionen kører som ejer og dermed forbigår de RESTRICTIVE `hide_demo_data_*` policies. Tilføjet `COALESCE(a.is_demo, false) = false` på begge grene (admin/skadeleder/super_admin og servicemedarbejder), samt filtrering på `assignments_employees.is_demo` og `profiles.is_demo` i team- og responsible_user-joins. Demo-data er nu kun synligt via `list_demo_assignments_with_team` for demo-brugeren.


## 2026-06-04 — Security: demo-data lækkede til live view (RLS)

### Security
- Alle `hide_demo_data_*` SELECT-policies (`assignments`, `assignments_employees`, `cars`, `notifications`, `on_call_duties`, `profiles`, `vacations`, `warehouse_items`) var oprettet som **PERMISSIVE**, hvilket betød at de blev OR'et med øvrige SELECT-policies — så enhver bruger med adgang til afd. 12 også så `is_demo=true` rækker (fx "Demo User" og sag "1221") i planneren. Konverteret alle 8 policies til **RESTRICTIVE**, så `is_demo=true` rækker nu kun er synlige for demo-brugeren `165cdbc9-…`. Predicate uændret.

## 2026-06-04 — Fix: bil-konflikt dialog overlap (luk picker før dialog)

### UI
- `MultipleCarSelector` viser igen den dedikerede AlertDialog "Bil allerede i brug", men bil-listen (Popover/Drawer) lukkes og unmountes nu fuldstændigt, *før* dialogen åbnes. Konflikten gemmes først i en `pending`-state der tvinger pickeren lukket, og promoveres derefter (efter exit-animation) til den aktive `dialog`-state. Dermed kan dropdownen aldrig overlappe dialogboksen eller skjule "Brug alligevel"-knappen, uanset z-index.

## 2026-06-03 — Security hardening (RLS, storage, edge functions)

### Security
- **RLS:** Fjernet permissive `{public} USING(true)`-policies på `cars`, `warehouse_items`, `profiles`, `user_roles` og duplikeret `departments`-policy. Uautentificerede brugere kan ikke længere læse brændstofkort, lageradresser, medarbejder-PII eller rolletildelinger. `anon`-rollen er eksplicit revokeret SELECT.
- **Storage:** `assignment-files` INSERT-policy strammet — kun admin/skadeleder, tildelte medarbejdere eller den ansvarlige bruger kan uploade til en sags mappe. Separat policy oprettet for `avatars` (egen mappe).
- **Super Admin:** `can_view_assignment_optimized()` tilføjet `super_admin` til rollechecket, så super admins igen kan se alle opgaver.
- **Performance:** Fjernet `log_security_event_safe()`-kald fra `secure_profile_access_unified` USING-clause — stoppede log-bloat og query-planner-degradering.
- **SECURITY DEFINER:** EXECUTE-rettigheder revokeret fra `PUBLIC`/`anon` på alle public-schema SECURITY DEFINER-funktioner; tildelt eksplicit til `authenticated` + `service_role`. `log_security_event_safe` kun for `service_role`.
- **Edge functions:** Sanitiseret rå `error.message` i HTTP-svar fra `admin-create-user`, `admin-list-users`, `admin-user-role`, `admin-user-status`, `cleanup-expired-users`, `cleanup-change-logs`, `send-duty-reminders`, `swap-duties`. Fulde fejl logges kun server-side via `console.error`.
- **Browser admin API:** Fjernet `supabase.auth.admin.createUser()`-fallback i `useEmployeeCreation.ts`. Direkte sti bruges nu kun til midlertidige (vikar) brugere som ikke har auth-record.



## 2026-05-20 — Fix: ferie-cleanup fejlede med "Cleanup Failed"

### Fix
- `delete_old_rejected_vacations()` havde ingen `EXECUTE`-grant, så admin-klientens daglige RPC-kald fejlede med `permission denied for function delete_old_rejected_vacations`. Efter 3 retries blev "Cleanup Failed — Vacation cleanup failed after multiple attempts" toast vist. Tildelt `EXECUTE` til `authenticated`.



## 2026-05-20 — Fix: auto-publicering fejlede pga. forkert kolonnenavn

### Fix
- `auto_publish_due_assignments()` refererede til kolonnen `date` på `public.assignments`, men kolonnen hedder `assignment_date`. Pg_cron-jobbet `auto-publish-assignments` har derfor fejlet hvert minut siden 2026-05-15 med `column "date" does not exist`, og ingen kladder blev auto-publiceret. Funktionen er nu rettet til at bruge `assignment_date`, og manuel kørsel publicerede straks de forsinkede kladder. Verificeret via `cron.job_run_details` og `auto_publish_log`.



## 2026-05-18 — Fix: permission denied for function is_admin_from_jwt

### Fix
- RLS-politikken `assignments_employees_select_policy` kalder `is_admin_from_jwt()`, men `authenticated`-rollen manglede `EXECUTE`-rettighed på funktionen. Det fik alle opdateringer/sletninger af opgaver (også som Super Admin) til at fejle med `permission denied for function is_admin_from_jwt` når medarbejder-links blev re-linket. Tildelt `EXECUTE` til `authenticated, anon` på `is_admin_from_jwt`, `get_auth_uid`, `get_auth_role` og `get_auth_jwt` så RLS-checks kan køre korrekt for alle roller inkl. Super Admin.

## 2026-05-18 — UI: sticky DialogHeader og DialogFooter

### UI
- `DialogHeader` og `DialogFooter` er nu `sticky` i toppen og bunden af `DialogContent`'s scroll-wrapper, så titel og submit/cancel-knapper forbliver synlige under scroll i lange formularer (CarFormDialog, EmployeeFormDialog, VacationFormDialog, UserFormDialog, DutyEditDialog m.fl.) — på både mobile og desktop. Header får `pr-12` for at undgå kollision med Close-X. Footer respekterer iOS safe-area via `pb-[max(1.5rem,env(safe-area-inset-bottom))]`. Zero-touch ændring — ingen consumer-dialoger behøver opdatering.

## 2026-05-18 — Performance: debounced prefetch on hover

### Performance
- `PlannerPage` uge-navigationsknapper (forrige/næste) debounce'er nu `queryClient.prefetchQuery` med 150 ms ved `onMouseEnter`. `onMouseLeave` annullerer pending timer, så hurtige musebevægelser hen over knapperne ikke trigger overflødige netværkskald. Cleanup ved unmount.


## 2026-05-17 — UI: standardiseret loading state med ListSkeleton

### UI
- Erstattet page-level spinners med `<ListSkeleton />` i `RouteLoadingFallback`, `App.tsx` (init), `MainLayout` (translation/auth init + redirect), `Index.tsx` (auth gate), `AdminPage`, `DutyPage` (liste + kalender), `PlannerPage` og `ScreenDisplayPage` for konsistent skeleton-baseret loading på tværs af appen.
- Fjernet ubrugt `Spinner`-import i `PlannerPage`. `LoadingSpinner` og `ui/spinner` filer bevares til knap-/micro-indikatorer.


## 2026-05-16 — PWA: vite-plugin-pwa med Workbox runtime cache

### Performance / Offline
- Tilføjet `vite-plugin-pwa` (`generateSW`) i `vite.config.ts`: precache af JS/CSS/HTML/font/billede-assets, `NetworkFirst` for Supabase REST/Functions med 5 min `maxAgeSeconds`, `NetworkFirst` for HTML-navigation, `CacheFirst` for Google Fonts og statiske assets, `cleanupOutdatedCaches: true`.
- Manifest: `name "Polygon Ugeplan"`, `short_name "Ugeplan"`, `theme_color "#00aeef"`, ikoner fra `/favicon.png` (192/512, maskable). `<link rel="manifest">` tilføjet i `index.html`.
- `src/main.tsx` afregistrerer service workers i iframe/preview-hosts (Lovable-editoren) for at undgå stale cache. Ingen background sync.

## 2026-05-16 — Performance: virtualisering af lange dag-sektioner i Planner

### Performance
- `DaySection` (standard-visning) virtualiserer nu kort-listen vha. `@tanstack/react-virtual` (`useWindowVirtualizer`) når en dag har mere end 12 opgaver. `estimateSize: () => 88`, `overscan: 3`, `getItemKey` på assignment-id, dynamisk `measureElement` for variable højder.
- Header, publish-knap, `DayAbsenceRow` og `EmptyDayCTA` forbliver uden for virtualiseringen.
- Compact- og gitter-visning samt dage med ≤12 opgaver renderer fortsat direkte. `AssignmentCard` er stadig `React.memo`-wrapped.


## 2026-05-15 — Performance: lazy-load af dialog-komponenter

### Performance
- Konverteret betinget renderede dialog-imports til `React.lazy` + `<Suspense fallback={null}>` så deres JS først hentes ved første åbning:
  - `AssignmentDetailsDialog` i `WeeklyAssignments`, `MineOpgaver`, `PlannerContent`.
  - `AssignmentDialogManager` i `WeeklyAssignments`.
  - `PlannerDialogContainer` + `SeriesActionDialog` i `PlannerPage`.
  - `SeriesActionDialog` i `AssignmentDialogManager`.
  - `VacationFormDialog`, `VacationActionDialog`, `AdminVacationFormDialog` i `VacationDialogs`.
  - `CarFormDialog`, `DeleteConfirmDialog` i `CarDialogs`.
- Hver dialog gates på sit eget `open`-flag inden Suspense-grænsen for at undgå unødig prefetch.

## 2026-05-15 — Dashboard: admin-widget for auto-publish historik

### Feature
- Ny tabel `auto_publish_log` (run_at, assignments_updated, department_id, triggered_by) med RLS — kun super_admin / administrator / skadeleder kan læse.
- `auto_publish_due_assignments()` opdateret: looper per afdeling og indsætter en log-række per afdeling per kørsel.
- Nyt admin-widget `AutoPublishLogWidget` i `DashboardCockpit` aside (vises kun ved `showMetrics && isEffectiveAdmin`) — viser de 10 seneste kørsler med tidspunkt + antal publicerede opgaver, filtreret på valgt afdeling.
- Hook `useAutoPublishLog` (React Query, 5 min staleTime, kræver `selectedDepartmentId`).
- Oversættelser tilføjet på `da` og `en`.

## 2026-05-15 — EmployeesTable: row-virtualisation ved >50 rækker

### Performance / a11y
- Tilføjet `@tanstack/react-virtual`. Desktop-tabellen skifter automatisk fra `SimplePagination` til virtualiseret body når `employees.length > 50` (estimeret rækkehøjde 56px, overscan 8, scroll-viewport `max-h-[calc(100vh-260px)]`).
- ≤50 rækker bruger den eksisterende paginering uændret. Mobile-card-view er ikke påvirket.
- `<table>` får nu `aria-rowcount` (data + header) i begge stier, så skærmlæsere altid ser det fulde filtrerede antal.

## 2026-05-15 — ScreenDisplayPage: full-page ErrorBoundary + neutral kiosk-fallback

### Reliability / UI
- `ScreenDisplayErrorBoundary` wrapper flyttet til at omslutte hele `ScreenDisplayPage` (loading/error/success), så uventede render-crashes i alle branches fanges.
- Fallback redesignet til TV/kiosk-brug: kun `bg-background` (ingen gradient eller destructive farve), Polygon-logo, neutral besked "Skærmen er ikke tilgængelig" og diskret "Genindlæs nu"-link.
- Tilføjet auto-reload via `setInterval(window.location.reload, 60_000)` i fallback, så skærmen selv kommer tilbage, når backend igen er tilgængelig.

## 2026-05-15 — PlannerPage: dokumenteret intentional guard på SeriesActionDialog

### Code clarity
- `handleOpenEditDialog` og `handleDeleteAssignment` har fået eksplicitte `INTENTIONAL`-kommentarer, der markerer, at `SeriesActionDialog` kun må vises når `findSeriesSiblings(assignment).length > 1`. Lone assignments (inkl. orphaned `groupId`) edit/deletes direkte uden series-prompt. Ingen logik-ændring.

## 2026-05-15 — AppSidebar: flade hover/active states uden dekorationer

### UI
- Aktivt nav-item: `bg-primary/10 text-primary` (tidligere fyldt `bg-sidebar-primary`). Den dekorative 3px venstre-bar ved aktivt item er fjernet.
- Hover: `bg-accent/40` uden tekst-farveskift (tidligere `bg-sidebar-accent` + accent-foreground).
- Eksplicit `transition-[background-color,color,opacity] duration-150 ease-out` + `cursor-pointer`. Ingen `scale`, `translate`, `shadow` eller `animate-*` på items. Reglerne gælder også for collapsed icon-rail (samme `renderItem`).
- Notifikations-badge i aktiv tilstand justeret til `bg-primary/15 text-primary` for læsbarhed mod den lysere baggrund.

## 2026-05-15 — WelcomeHeader: 60s ur-interval + memoiseret dato/uge

### Performance
- `WelcomeHeader`: `setInterval` sænket fra 30s → 60s og alignet til næste hele minut, så HH:MM kun re-rendrer pr. minut-skift.
- Dato (ugedag, ISO-uge, d.M.yyyy) og hilsen er nu `useMemo`-cachet baseret på en mount-only `Date` (`useRef`) — opdateres ikke ved minut-tick, kun ved mount/sprog-/navne-skift.

## 2026-05-15 — Brand-stripes fjernet, separation via border

### UI
- Fjernet horisontal `brand-stripe` under `AppTopBar` — topbar adskilles nu udelukkende af eksisterende `border-b border-border`.
- Fjernet venstre 1px primary-stripe på `WelcomeHeader` (inline `bg-primary` div + `relative/overflow-hidden`).
- Fjernet venstre 3px primary-stripe (`brand-card-accent::before`) på `VacationNotificationsPanel` og `WeeklyAssignments`. Card-border bevarer separationen.
- `src/index.css`: slettet `.brand-stripe` og `.brand-card-accent`-klasserne. Polygon-blå optræder nu kun på interaktive elementer (knapper, aktive nav-items, links) og som svag tonet baggrund på `.brand-card-header` / `.brand-dot`.

## 2026-05-15 — Flade pille-chips erstatter frosted-glass

### UI
- `src/index.css`: `.chip-glass`, `.chip-glass-primary/-amber/-emerald/-indigo/-destructive` omskrevet til flade piller — solid `hsl(var(--muted))` baggrund, 0.5px solid border i variantens farve, ingen `backdrop-filter`, ingen translucens, ingen inner-highlight `box-shadow`. Farveramp (primary/amber/emerald/indigo/destructive) bevaret via semantiske tokens og light/dark color-overrides.
- Kun `ConflictBadge` bruger klasserne i dag — ingen Planner-komponenter ændret.

## 2026-05-15 — Login-side: solid Polygon-blå baggrund

### UI
- Fjernet animeret mesh-/blob-gradient og logo-shimmer på `LoginPage` (både desktop venstre-panel og mobil-banner). Erstattet med en ren, solid `bg-polygon-blue` (#00aeef) baggrund.
- Slettet keyframes og animations-entries i `tailwind.config.ts`: `mesh-drift`, `mesh-drift-alt`, `mesh-float-1/2/3`, `logo-shimmer`. Logo-containerens `animate-logo-shimmer`-klasse fjernet to steder.

## 2026-05-15 — CI-gate mod døde imports

### Tooling / Quality
- Ny GitHub Actions workflow `.github/workflows/ci.yml` der kører `npm ci` + `npm run lint:ci` + `npm run build` på hver pull request mod `main` (samt push til `main`). Concurrency-gruppe annullerer in-flight kørsler ved nye pushes.
- Tilføjet `eslint-plugin-unused-imports` (devDependency) og aktiveret `unused-imports/no-unused-imports: "error"` i `eslint.config.js`. Nye PR'er fejler nu hårdt hvis de introducerer ubrugte imports.
- Nyt npm-script `lint:ci` (`eslint . --quiet`) der kun rapporterer errors — bruges af CI så pre-eksisterende warnings (no-explicit-any m.fl.) ikke blokerer.
- Auto-fixet 51 eksisterende døde imports på tværs af kodebasen så første CI-kørsel starter grønt.
- Pre-eksisterende lint-regler med få overtrædelser (no-explicit-any, no-require-imports, no-empty-object-type, rules-of-hooks, no-useless-escape, prefer-const) downgradet til `warn` for ikke at blokere CI på legacy-kode. Kan strammes igen i en separat oprydningsopgave.

## 2026-05-15 — Sikkerhedsforbedringer af RPC-helpers

### Security / Reliability
- Ny `public.cleanup_session_data(timestamptz)` wrapper-funktion der videresender til `demo.cleanup_session_data`. Retter runtime-fejl i `demoUserService.cleanupAllDemoUserData()` (PostgREST eksponerer kun `public` schema, så det direkte kald fejlede med 404).
- Strammet `search_path = ''` på 5 SECURITY DEFINER-funktioner: `get_current_user_role`, `is_admin_user`, `cleanup_demo_data_ttl`, `reset_demo_data`, `list_accessible_assignments_with_team`. Alle interne tabel- og typereferencer er nu schema-kvalificerede (`public.user_roles`, `public.user_role`). Bringer funktionerne i overensstemmelse med Core security-reglen i memory-indekset.
- Ingen funktionel adfærdsændring — kun sikkerhedshærdning. Pre-eksisterende linter-warnings om `SECURITY DEFINER`-eksekvering er ikke berørt af denne migration.

## 2026-05-15 — RLS-performance benchmark (planner-forespørgsler)

### Observability / Performance
- Kørt `EXPLAIN (ANALYZE, BUFFERS)` på 6 centrale planner-queries (assignments, assignments_employees, on_call_duties, vacations, profiles, cars). Typisk total ~45 ms execution på warm cache.
- Verificeret at fjernede log-tunge RLS-policies har stoppet alle 8 tidligere event-typer (`own_detailed_profile_access`, `admin_profiles_*`, `fuel_card_access`, `cars_data_access`, `profiles_basic_access`, `unauthorized_admin_profiles_access`, `access_attempt`) — 0 nye rows i 30+ dage.
- Rapport: `/mnt/documents/rls-performance-report.md`. Follow-ups identificeret: manglende index på `assignments_employees(assignment_id)` (Q2: 22 ms Seq Scan), `secure_assignment_access`-logging i RPC, og konsolidering af 9 policies på `profiles`.

## 2026-05-15 — Web Vitals-målinger (LCP/INP/CLS/FCP/TTFB)

### Observability
- Tilføjet `web-vitals` library og ny `src/utils/webVitals.ts` der måler Core Web Vitals globalt. I DEV logges hver måling til konsollen; i alle miljøer batches og persisteres målinger til ny Supabase-tabel `web_vitals_metrics` ved `pagehide` / `visibilitychange=hidden` (lav netværks-overhead, ingen indvirkning på initial render — kører via `requestIdleCallback`).
- Hver måling tagges med route, user_id, device_type, connection_type, user_agent og session_id. Demo-bruger filtreres fra. RLS: brugere kan kun indsætte egne målinger; kun admin/skadeleder kan læse.
- Ny admin-tab "Web Vitals" på `/admin` med periode- og side-filter, p75 KPI-kort pr. metric (good/needs-improvement/poor andele) og top-10 langsomste sider.

## 2026-05-15 — Error Boundaries omkring planner-komponenter

### Reliability
- Ny komponent `PlannerWidgetErrorBoundary` (`src/components/ErrorBoundary/PlannerWidgetErrorBoundary.tsx`) — lokaliseret (da/en), kompakt fallback med "Prøv igen", DEV-only fejldetaljer.
- `PlannerContent` wrapper nu hver topsektion (UnassignedResources, DutyWeek, Current/Future-lister, Past-lister) i sin egen boundary, så en fejl i én widget ikke tager hele Planner-siden ned.
- `CurrentAndFutureDays`, `PastAssignments`, `CompactCurrentAndFutureDays` og `CompactPastAssignments` wrapper hver enkelt dag i en boundary — en korrupt `AssignmentCard` på én dato isolerer fejlen til den dag, mens de øvrige dage stadig vises.

## 2026-05-15 — Virtualisering af Weekly Planner

### Performance
- Tilføjet `@tanstack/react-virtual` og en ny `VirtualList`-komponent (`src/components/Planner/VirtualList.tsx`) baseret på `useWindowVirtualizer` med dynamisk row-måling (`measureElement`).
- `CurrentAndFutureDays`, `CompactCurrentAndFutureDays`, `PastAssignments` og `CompactPastAssignments` rendres nu kun for de synlige dage (overscan 4) når listen overstiger 10 dage. Under tærsklen falder den tilbage til normal rendering, så små lister er upåvirkede.
- Reducerer DOM-noder og initial render-tid markant ved store ugelister/historiske perioder med mange opgaver. Window-scroll bevares — ingen indre scroll-container indført.
## 2026-05-15 — Auto-publicering af opgaver (server-side)

### Fixed
- **DB-funktion `public.auto_publish_due_assignments()`** + pg_cron job `auto-publish-assignments` (kører hvert minut). Den tidligere client-side `useAutoPublishAssignments` blev fjernet uden erstatning — auto-publicering fungerede derfor reelt ikke. Nu publiceres alle ikke-publicerede opgaver med `assignment_date <= dagens dato (Europe/Copenhagen)` automatisk senest 1 minut efter midnat dansk tid, uafhængigt af om en bruger er logget ind. DST håndteres via `AT TIME ZONE 'Europe/Copenhagen'`. Funktionen er idempotent og logger antal publicerede til `public.logs` (`event_type = 'auto_publish'`).

## 2026-05-15 — Lazy-load pdf-lib (bundle-optimering)

### Optimering
- **`src/hooks/assignment/useAssignmentFiles.ts`:** `pdf-lib` (~600 kB / 178 kB gzip) er nu dynamic-importeret inde i `generatePdf()` i stedet for at blive eager-loaded i top af filen. Loades først når en bruger klikker "Eksportér til PDF".

### Effekt
- "useWarehouseIndicators"-chunken (delt af Planner/Dashboard via AssignmentCard) faldt fra **238 kB → 63 kB gzip** (-175 kB).
- pdf-lib ligger nu i egen lazy chunk (178 kB gzip) der kun hentes ved PDF-eksport.
- Initial load af Planner og Dashboard er markant lettere.


## 2026-05-15 — Bundle-analyse + vite manualChunks fix

### Fixed
- **`vite.config.ts`:** Production build var brækket fordi `manualChunks` refererede til pakker fjernet ved tidligere dead-code-oprydning (`@radix-ui/react-accordion`, `recharts`). Listen er ryddet op og udvidet med faktisk-brugte Radix-komponenter (`alert-dialog`, `collapsible`, `context-menu`, `radio-group`, `slot`, `toggle`, `toggle-group`).

### Bundle-analyse (efter fix)
Top chunks (gzip):
| Chunk | Gzip | Note |
|---|---|---|
| **useWarehouseIndicators** | **238 kB** | ⚠️ Indeholder `pdf-lib` (importeret eager i `useAssignmentFiles.ts`) — kandidat til dynamic import |
| index (entry) | 89 kB | Hovedbundle |
| react-vendor | 53 kB | OK |
| ui-vendor (Radix) | 46 kB | OK |
| supabase-vendor | 28 kB | OK |
| PlannerPage | 19 kB | Fint efter route-split |
| DashboardPage | 18 kB | OK |
| data-vendor | 17 kB | OK |
| AdminPage | 16 kB | OK |

`dist/stats.html` genereret via rollup-plugin-visualizer.

### Næste optimering (ikke implementeret)
- Dynamic-import `pdf-lib` inde i `generatePdf()` i `useAssignmentFiles.ts` → fjerner ~200 kB gzip fra initial load af planner/dashboard. Forventet største enkeltgevinst.


## 2026-05-15 — Memoization af uge-beregninger (UI performance)

### Optimering
- **`src/utils/dates/weekCore.ts`:** Tilføjet module-level cache i `getWeekDates(week, year)` — samme `(week, year)` returnerer nu samme objekt-reference på tværs af renders, hvilket holder React `useMemo`/`useEffect`-deps stabile. Pre-formaterede `startStr`/`endStr` (YYYY-MM-DD) inkluderet for billig string-sammenligning. Ny helper `getISOWeekInfoForDate(dateStr)` med FIFO-cache (cap 1000) til ISO-uge-opslag på datostrenge. Fjernet støjende DEV-`console.log`.
- **`src/pages/PlannerPage.tsx`:**
  - Erstattet inline `getWeekDates` og lokal `getAllWeekDays` med cachet util fra `@/utils/dates`.
  - `weekDates` indpakket i `useMemo` på `(selectedWeek, selectedYear)`.
  - `weekAssignments`-filter: skiftet fra `new Date(...)` + `getISOWeek` + `getISOWeekYear` per række til lexicographic YYYY-MM-DD string-sammenligning mod `weekDates.startStr/endStr` — eliminerer O(n) Date-allokering pr. render.
  - `handlePreviousWeek`/`handleNextWeek` indpakket i `useCallback` og bruger memoiseret `weekDates.start`.

### Effekt
- Færre allokationer og date-fns-kald pr. render i Planner.
- Stabile referencer reducerer downstream re-renders i `PlannerContent`.


## 2026-05-14 — Liste-paginering (UI performance)

### Tilføjet
- **Ny komponent:** `src/components/shared/SimplePagination.tsx` — let, genbrugelig paginerings-kontrol (Forrige/Næste + sidetæller), bruger semantiske tokens.
- **Employees (`EmployeesTable`):** Client-side paginering 25 pr. side på både desktop-tabel og mobile-kort. Reset til side 1 når listen ændrer længde (filter/søgning).
- **Cars (`CarsList`):** Client-side paginering 25 pr. side på både desktop og mobile. Sortering flyttet i `useMemo`.
- **Weekly Planner — past assignments (`PastAssignments` + `CompactPastAssignments`):** Progressive disclosure — viser de seneste 14 datoer som standard, "Vis flere"-knap loader 14 ad gangen. Undgår tunge renders når brugeren scroller bagud i historikken.

### Effekt
- Færre DOM-noder pr. render på lister med mange entries → hurtigere interaktion (især på mobil).
- Ingen ændringer til Supabase-queries eller RLS — datasæt hentes uændret pr. afdeling.


## 2026-05-14 — Dead-code oprydning

### Slettet (verificeret ubrugt via knip + import-grep)
- **Komponenter (~30):** gamle `Notifications/`-stak, duplikerede `Employees/EmployeeList*` + dialogs, ubrugte Dashboard-widgets (`AssignmentDistributionChart`, `DashboardMetrics`, `InteractiveMetricCard`, `MetricCard`, `SystemMetricsOverview`, `VehicleStatusWidget`), `AutoPublishHandler` (afløst af edge function + DB cron), `PasswordResetDebugger`, gammel `ErrorBoundary.tsx` + `DashboardErrorBoundary`, `Duty/DutyAssignmentForm` + `DutyReassignDialog`, `Layout/NavComponents/{DepartmentSelector,DesktopNavigation,MobileNavigation,Logo}`, `Layout/NavigationItems`, `Planner/AssignmentList` + `CarSelector`, `Vacation/{EmployeeVacationStatus,EnhancedVacationForm,VacationButtons,VacationCard}`, `shared/{Card,Metrics,Table}Skeleton`, `App.css`.
- **Hooks (11):** `assignment/{useAssignmentActions,useAssignmentDialogState,useAssignmentFormState,useAssignmentHelpers,useCarDataHandler}`, `useAssignmentFilters`, `useAutoPublishAssignments`, `useDashboard`, `useDiagnostics`, `usePlannerPage`, `vacation/useVacationRequestActions`.
- **Services/utils/types (8):** `assignmentFilterService`, `data/assignmentService`, `secureProfileService`, `securityManager`, `supabaseIssuesAuditor`, `databaseCleanup`, `securityValidation`, `types/{navigation,notification.d}`.
- **shadcn UI primitives (17):** `accordion`, `aspect-ratio`, `breadcrumb`, `carousel`, `chart`, `command`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `progress`, `resizable`, `secure-input`, `slider`, `sonner`.
- **Edge functions (2):** `admin-delete-user` (afløst af `admin-user-delete`), `swap-duty` (afløst af `swap-duties`). Også undeployet via Supabase + fjernet fra `supabase/config.toml`.
- **NPM dependencies (14):** `@radix-ui/react-{accordion,aspect-ratio,hover-card,menubar,navigation-menu,progress,slider}`, `cmdk`, `embla-carousel-react`, `input-otp`, `next-themes`, `react-resizable-panels`, `recharts`, `@tailwindcss/typography`.

### Bevaret bevidst
- `/docs/**`, `supabase/migrations/**`, `mem://`, `src/integrations/supabase/types.ts`, alle stadig-importerede shadcn-komponenter, `@hookform/resolvers`/`zod` (form-pattern), `@testing-library/*` + `vitest` + `jsdom` (test-infra).


## 2026-05-14 — Hærdning af SECURITY DEFINER-funktioner

### Adgang strammet
- Revoke EXECUTE fra `PUBLIC`, `anon`, `authenticated` på ~55 interne SECURITY DEFINER-funktioner, der ikke skal kunne kaldes via `/rest/v1/rpc/*`.
- Omfatter: alle trigger-funktioner (`handle_*`, `update_*`, `validate_*`, `log_assignment_deletion`, `security_audit_trigger`, `rls_auto_enable`, `auto_apply_rls_to_log_partitions`, `apply_logs_rls_policies`), alle `log_*`-helpers, alle vedligeholdelses-/cron-jobs (`cleanup_*`, `delete_*`, `emergency_log_cleanup`, `refresh_materialized_views`, `run_*_maintenance`, `sync_user_roles_to_jwt` m.fl.), diagnostics (`check_*`, `verify_*`, `debug_auth_info`, `enhanced_security_monitor`, `get_enhanced_system_metrics`, `get_security_events_summary`, `security_health_check`, `validate_input_security`) samt intern helper `get_car_with_conditional_access`.
- Triggers påvirkes ikke (kører som table-owner). Helpers kaldt fra andre SECURITY DEFINER-funktioner virker uændret (ydre definer kører som owner).
- Bevarede RPCs: rolle-/access-helpers brugt i RLS (`is_admin_*`, `is_super_admin`, `has_role`-familien, `can_*`, `get_user_*`), samt frontend-RPCs (`list_accessible_assignments_with_team`, `get_profiles_admin_detailed`, `get_cars_with_security`, demo-funktioner, `cancel_duty_swap`, `clear_sick_leave_data`, `reset_demo_data`).
- Resultat: scanner-fund faldt fra 82 → 37 (de 37 er bevidst eksponeret).

## 2026-05-14 — Global optimering Fase 5: Database & RLS-audit

### Performance/log-bloat fix (kritisk)
- **`assignments.assignments_restricted_access`** SELECT-policy fjernet. Den kaldte `log_security_event_safe('assignment_access', …)` på HVER række-scan, hvilket genererede log-bloat (planner = 100+ rows pr. page) og skrev synkront til logs-tabellen ved hver assignment-læsning. Adgang dækkes uændret af `Users can view accessible assignments` (`can_view_assignment_optimized`).
- **`notifications.notifications_owner_only`** SELECT-policy fjernet. Samme problem (`log_security_event_safe('notification_access', …)`). Adgang dækkes uændret af `Users can view their notifications`.

### Duplikerede policies fjernet
- `notifications.notification_delete_policy` (duplikat af `Users can delete their notifications`).
- `notifications.notification_update_policy` (duplikat af `Users can update their notifications`).
- Postgres OR-merger permissive policies, så duplikater øger planner-omkostning uden at ændre adgang.

### Konsistens
- `cars.cars_select` strammet fra rolle `{public}` til `{authenticated}`. Functional gating uændret (qual krævede allerede `auth.uid() IS NOT NULL`); ren cosmetics for at matche resten af skemaet.

### Bekræftet allerede sikkert (stale scanner-fund)
- 4 ERROR-niveau "PUBLIC_USER_DATA"/"EXPOSED_SENSITIVE_DATA" fund fra Lovable security scanner (profiles/user_roles/cars/warehouse_items `USING (true)`) viste sig at være cached fra tidligere fase — live `pg_policies` viser at de allerede er fjernet. Markeret som fixed i security-tracker.

### Bevidst ignoreret (intentional pattern)
- 87 Supabase linter WARN'er om "Signed-In Users Can Execute SECURITY DEFINER Function": alle er RLS-helpers (`is_admin_user`, `has_role`, `can_view_assignment_optimized`, etc.) der KRÆVER SECURITY DEFINER for at undgå rekursion i policy-evaluering. Standard Supabase-pattern. Markeret som ignored med begrundelse i security memory.

### Verificering
- Migration kørt + bekræftet via live `pg_policies`-query.
- Adgangsmatrix verificeret uændret: hver dropet policy har en eksisterende sibling med samme USING-logik (uden logging-side-effect).
- `assignment_update_policy`, `assignment_insert_policy`, `assignment_delete_policy` urørt — kun den loggende SELECT-duplikat fjernet.


## 2026-05-14 — Global optimering Fase 4: Performance (statisk)

### Render-optimering
- Wrappet hot Planner-leaf komponenter i `React.memo` for at undgå spildte re-renders når søskendekort opdateres: `AssignmentCard`, `AssignmentDetails`, `AssignmentStatusBadge`, `AssignmentActionButtons`, `ConflictBadge`, `DayAbsenceRow`. Ingen ændring af adfærd — kun referential gating via shallow prop-compare.

### Bundle / dev-cold-start
- Tilføjet `lucide-react` til `vite.config.ts` `optimizeDeps.include` for hurtigere dev-server cold-start (mange små icon-imports forhåndsbundles).

### Verificeret allerede optimalt (ingen ændring nødvendig)
- Console-statements: alle 27 fund er allerede `if (import.meta.env.DEV)`-guarded. Terser dropper dem også i prod-build (`drop_console: true`).
- Realtime cleanup: alle 11 filer der kalder `.subscribe()` har matchende `removeChannel`/`unsubscribe` i `useEffect`-cleanup. Ingen memory leaks fundet.
- Route-level lazy + Suspense + retry-wrapper er på plads for alle 14 sider.
- Manuel chunking: react/ui/data/supabase/utils/charts vendors splittet korrekt.
- React Query: 5min staleTime, 10min gcTime, `refetchOnWindowFocus: false`.

### Ud af scope
- Web Vitals (LCP/INP/CLS), React Profiler-flamegraph, virtualisering — kræver runtime/browser-måling.
- User kan køre `npm run build` og åbne `dist/stats.html` for visuel bundle-rapport.


## 2026-05-14 — Global optimering Fase 3: UI/a11y

### Tilgængelighed
- Tilføjet `aria-label` til 33 icon-only buttons (shadcn `size="icon"` uden synlig tekst) i Admin (DepartmentManagement, SubDepartmentManagement, UserManagement, UserTableRow, VacationCalendarOverview), Assignment (FilesPanel, MessagesPanel), Cars (FalckSubscriptionButton), Duty (List, MonthCalendar) og Layout/NavComponents/NotificationsList. Bruger `t()` med dansk fallback.
- Verificeret at `SidebarTrigger` og `Notifications/NotificationsDropdown` allerede har `<span className="sr-only">` (ingen ændring).
- Verificeret kun ét `<main>` pr. side (LoginPage bypasser AppShell via path-check; `SidebarInset` er ikke i brug).

### Kontrast
- Hævet empty-state ikon-opacitet `text-muted-foreground/40` → `/60` i `EmployeesTable` og `CarsList` for WCAG AA.

### Bevidst skip
- 219 hardcoded farve-hits er overvejende intentionelle status-farver (røde fejl, grønne success, gule advarsler, traffic-light availability) — knowledge-godkendt, ikke refaktoreret.

## 2026-05-14 — Global optimering Fase 2: Login & sessionhåndtering (statisk review)

### Funktionelle fix
- **AuthContext**: Auth-listener re-mountede ved hver TranslationContext-render (`t`/`toast` ustabile deps). Flyttet til refs så listener kun mountes én gang.
- **Session-expired**: Erstattet `setTimeout(window.location.href = '/login', 1000)` med direkte `window.location.replace('/login')` (kun hvis ikke allerede på /login) — fjerner 1s flicker og history-pollution.
- **`signUp`**: Tilføjet `emailRedirectTo: ${origin}/login` (knowledge-krav for Supabase auth).
- **`register`**: Boblede tidligere kun en generisk fejl op fra `admin-create-user` edge function. Nu propageres edge function-beskeden så admins ser den reelle årsag (fx "email already exists").
- **Login-form race**: Fjernet `window.location.replace('/dashboard')` i form efter succes — `LoginPage` håndterer nu navigationen via React Router når `userDataLoaded` er klar. Fjerner dobbelt-navigation og hard-reload.
- **Login-form timeout**: `if (!loginTimeout) setIsLoading(false)` læste stale closure (altid `false`). Erstattet med lokal `timedOut` flag, som også guarder mod at sætte success/error state hvis login svarer EFTER 15s timeout.
- **PasswordResetPage email-flow**: `handleEmailBasedReset` kaldte `admin-reset-password` med `{ email }`, men funktionen forventer `{ userId, newPassword }` og kræver admin-JWT — så email-baseret reset for ikke-loggede brugere var brudt. Skiftet til `supabase.auth.resetPasswordForEmail()` som er det offentlige flow.
- **PasswordResetPage**: Hævet min. password-længde fra 6 til 8 tegn ved token-baseret reset.

## 2026-05-14 — Global optimering Fase 1: Sikkerhed

### Sikkerhedsfix
- **Edge function `swap-duties`**: Fjernet impersonation-vektor. Body-feltet `requestedBy` ignoreres nu til alle autorisationstjek; `user.id` fra det verificerede JWT bruges i stedet. Body-feltet bevares kun for backwards compatibility (notifikations-routing).
- **SECURITY DEFINER public-funktioner**: `REVOKE EXECUTE ... FROM anon, PUBLIC` på alle ~60 funktioner i `public`-skemaet. Lukker 101 Supabase-linter advarsler (188 → 87). Indloggede brugere kan stadig kalde alt det app'en behøver.
- **Højrisiko-funktioner ekstra hærdet**: `schedule_maintenance_tasks`, `validate_database_health`, `test_query_performance`, `validate_data_integrity`, `final_database_optimization`, `generate_database_summary` revoked fra `authenticated`. De kan nu kun kaldes af `service_role` / postgres.
- **Verificeret stale fund**: `pg_policies` bekræfter at de gamle "USING true public"-policies på `profiles`, `user_roles`, `cars`, `warehouse_items` og storage `assignment-files` er væk (fjernet 2026-04-30). Markeret som fixed i scanner.

### Dokumentation
- `mem://security-memory` opdateret med ny adgangsmodel, accepteret risiko (0029-warns for app-funktioner) og næste audit-skridt.

### Bevaret intakt
- Alle eksisterende RPC-kald fra UI (`accept_duty_swap`, `has_role`, `is_admin_user` osv.) virker uændret.
- Ingen tabel-, kolonne- eller policy-strukturændringer.

### Næste skridt (Fase 1b — udskudt)
- Scope `realtime.messages`-policies til department/user-membership.
- Stram storage INSERT-policy på `assignment-files` (kræver path-konventions-verifikation).


## 2026-05-12 — Vagter: farveskel, multi-byt, multi-tildel og flere vagter pr. dag
- Medarbejderstatus: Fraværende vises nu rød (error), Ferie/Fri vises gul (warning).
- Vagtbyt omlagt til byttetilbud med flere kandidater og atomisk først-til-mølle accept via ny accept_duty_swap RPC. Vises "Vagten er taget"-dialog hvis allerede overtaget.
- Ny tabel duty_swap_requests med RLS, realtime og SECURITY DEFINER accept/cancel funktioner.
- Bekræftet at flere skadeledere/kørevagter samme dag allerede understøttes (ingen DB-blokering, UI mapper alle).
- Fix: `DutySwapDialog` crashede med "Rendered more hooks than during the previous render" — hooks (`useState`/`useEffect`/`useMemo`) flyttet før early return.
- Multi-vagt UX: månedskalenderen viser nu en "+"-knap pr. dag (kun for adminstratorer) der åbner tildelingsdialogen med datoen forudvalgt, så flere vagter pr. dag kan oprettes uden friktion.
- Tildel vagt: medarbejdervælgeren er nu en multi-select med checkbokse, så flere skadeledere/kørevagter kan tildeles på én gang (én vagt pr. medarbejder pr. valgt dato).



## 2026-05-01 — Login: forenklet brand-panel og mere levende mesh-baggrund
- Venstre brand-panel: hvid headline, fjernet lang beskrivelse, kortere feature-tekster, strammere spacing.
- Mesh-baggrund: nye `mesh-float-1/2/3` keyframes med større translate og skala-pulse for tydeligt mere bevægelse.
- Respekterer `prefers-reduced-motion` (statisk fallback).

## 2026-04-30 — Sikkerhedsoprydning: RLS, GraphQL & SECURITY DEFINER

### Sikkerhedsfix (alle scanner-fund løst)
- **profiles**: Fjernet `Users can view all profiles` (USING true) der gjorde alle 69 medarbejderprofiler — inkl. email, telefon, adresse, GPS — synlige for enhver indlogget bruger. Adgang sker nu udelukkende via `secure_profile_access_unified` (egen profil + admin/skadeleder ser alle). Fjernet duplikat insert/update-policies på `public`-rolle; `authenticated`-versioner bevaret.
- **cars**: Fjernet `Users can view all cars` (USING true) og duplikat `Admins can manage cars`. Læsning kræver nu autentisering; brændstofkort-koder ikke længere offentligt læsbare.
- **realtime.messages**: RLS aktiveret med policies der begrænser broadcast-modtagelse til `authenticated`. `postgres_changes`-events filtreres fortsat per-row af RLS på underliggende tabeller.
- **storage.objects (avatars)**: Listing begrænset til `authenticated`. CDN-visning via `getPublicUrl` virker uændret.
- **7 SECURITY DEFINER diagnostik-funktioner**: Tilføjet `is_admin_user()`-guard, `EXECUTE` revoked fra `anon`. Beskytter audit-log mod uautoriseret sletning.
- **GraphQL-eksponering**: `pg_graphql`-extension droppet (appen bruger udelukkende PostgREST). Lukker 220 lints (0026/0027) uden funktionel impact.
- **anon-rolle**: `SELECT` revoked på alle public-tabeller; appen bruger kun authenticated JWT.
- **Interne logtabeller**: `logs*`, `system_cleanup_tracking` — `SELECT` revoked fra `authenticated` (RLS gav allerede kun admin adgang).

### Ændret (kode)
- `src/hooks/useDiagnostics.ts`: `check_system_health`-kald håndterer admin-only fejl pænt — non-admins får `warning`-status med "skipped"-besked.

### Bevaret intakt
- App-funktioner: profil-visning, biler, opgaver, ferie, vagter, lager, realtime, avatar-upload, fil-upload, admin-diagnostik.
- Alle eksisterende `authenticated`-policies for app-tabeller.
- Legacy-kolonner i `assignments` og `cars` (jf. memory).


## 2026-04-29 — Login: Husk mig, A11y, bedre fejl, intern tone & lækker mobil

### Tilføjet
- **"Husk mig"-checkbox** på login-formen. Når aktiv (default), persisteres sessionen i `localStorage` og overlever browser-restart. Når inaktiv, gemmes sessionen i `sessionStorage` og forsvinder når tabben lukkes.
- **Hybrid storage-adapter** i `src/integrations/supabase/client.ts` der dynamisk vælger `localStorage` vs `sessionStorage` ud fra `auth_remember_me`-flag.
- **Tydelige fejlbeskeder** klassificeret efter type: ugyldige credentials, netværksfejl (incl. offline-banner via `navigator.onLine`), timeout, lockout, manglende felter — hver med egen ikon og handlings-rettet tekst på dansk/engelsk.
- **Success-toast og inline-success** med grøn `Alert` ved login.
- **Fuld tastatur- og skærmlæser-tilgængelighed**: `aria-invalid`, `aria-required`, `aria-busy`, `aria-live="assertive"` på fejlregion med auto-fokus, korrekt `aria-label` på password-toggle (med `aria-pressed`), `noValidate`-form med `aria-describedby`. Email-feltet auto-fokuseres ved mount.

### Ændret
- **`LoginPage.tsx`** har en mere neutral, intern tone (ingen salgs-pitch, ingen citat, ingen "træk-og-slip"-omtale). Tagline: "Polygon Ugeplan — Internt planlægningssystem for skadeservice." Feature-kort beskriver nu reelle moduler (Ugeplan, Vagter & ferie, Adgang pr. afdeling).
- **Mobil-layout (<lg)** viser nu samme animerede mesh-gradient som top-banner med logo, headline og undertekst. Login-card overlapper banneret med `-mt-10` for et lækkert moderne look. Spacing og typografi er afstemt til mobil.
- **Sonner-toasts** brugt til alle login-notifikationer (success/fejl) i stedet for legacy `useToast`.


## 2026-04-29 — Login: split-screen brand panel med animeret mesh-gradient

### Ændret
- `LoginPage.tsx`: redesignet til to-kolonne SaaS-layout. Venstre side er et Polygon-blåt brand-panel med animeret mesh-gradient (3 drivende blå/cyan/teal blobs), subtilt grid-overlay, logo, tagline, 3 feature-kort og kunde-citat. Højre side rummer en ren, centreret login-form med velkomst, brand-footer og bevarede mobil-fallback (logo).
- `tailwind.config.ts`: tilføjet `mesh-drift`, `mesh-drift-alt` og `logo-shimmer` keyframes/animationer til login-baggrunden og logo-glow.
- Alle visuelle elementer bruger semantiske design-tokens (`hsl(var(--primary))`, `text-primary-foreground` via `text-white` på den mørke gradient) og brand-farver fra `polygon.*` paletten.


## 2026-04-29 — Planner: tooltips på filter-chips + responsiv wrap

### Ændret
- `FilterChips.tsx`: tilføjet kort tooltip (Radix `Tooltip`) på hver chip der forklarer præcist hvad filteret gør — fylder ikke mere på skærmen, vises kun ved hover/fokus. `aria-label` tilføjet for skærmlæsere.
- `PlannerPage.tsx` filter-rækken bruger nu `flex-col lg:flex-row` så chips wrapper pænt og view-knapperne aldrig skubbes ned på små/mellemstore skærme.


## 2026-04-29 — Dashboard: HH:MM-ur, valideret hilsen og forbedret QuickAccess

### Ændret
- `WelcomeHeader.tsx`: Ur viser nu kun `HH:MM` (uden sekunder); opdaterer hvert 30. sek så ur, ugenummer og dato altid er live.
- `WelcomeHeader.tsx`: Tidshilsen valideret og strammet op — 08–10 Godmorgen, 10–12 God formiddag, 12–16 God eftermiddag, 16–08 Godaften (ingen "Hej"-fallback i drift).
- `QuickAccessGrid.tsx`: Tydeligere hover (primær-tonet baggrund + ikon i `primary`) og synlig `focus-visible`-ring for tastatur­navigation.

## 2026-04-29 — Dashboard: kompakte genveje, tidshilsen og live-ur

### Ændret
- **`QuickAccessGrid`**: kort er nu kompakte ikon+titel-rækker (beskrivelse fjernet, mindre padding, 3 kol. mobil / 5 kol. desktop). Flyttet **op over** "Mine Opgaver" / `WeeklyAssignments` i `DashboardCockpit`.
- **`WelcomeHeader`**:
  - Hilsen er nu tidsafhængig: 08–10 "Godmorgen", 10–12 "God formiddag", 12–16 "God eftermiddag", 16–00 "Godaften" (engelsk variant tilsvarende). Falder tilbage til "Hej" uden for intervallerne.
  - Tilføjet **live-ur** (`HH:MM:SS`) i højre datoblok — opdateres hvert sekund. Datoblokkens uge/dato følger nu også real-tid (ikke kun mount-tid).


## 2026-04-29 — Tom-dag-handling (Step 5/E) + Fravær skjult ved kollaps

### Tilføjet
- **`EmptyDayCTA`-komponent** (`src/components/Planner/EmptyDayCTA.tsx`): vises i udvidede dagsektioner uden opgaver. Indeholder "+ Tilføj opgave" (åbner opret-dialog forhåndsudfyldt med dagens dato) og "Kopiér fra i går (N)" (kopierer alle gårsdagens opgaver som kladder til den valgte dato).
- **`handleCopyDayFromYesterday`** i `PlannerPage`: bulk-opretter kopier som kladder, springer over medarbejdere på godkendt fravær for målsdatoen, og viser toast med antal kopier + antal udeladte fravær-tildelinger.

### Ændret
- **`DayAbsenceRow`** vises nu kun når dagen er udvidet (`isExpanded`) — sammenklappede dage er fri for fraværspills for at holde headeren ren.


## 2026-04-29 — Inline daglig publicering (Step 4/D) + DaySummary fjernet

### Tilføjet
- **Inline publicering pr. dag**: "Publicér N kladder"-knap i `DaySection`-headeren viser nu det præcise antal kladder for dagen. Klik åbner en `AlertDialog` med bekræftelse ("Publicér N kladder for {dato}?") inden bulk-publicering køres via eksisterende `publishAssignmentsByDate` (skriver allerede til `planner_change_log`).
- Knappen er kun synlig når brugeren har `canPublishTasks` OG dagen indeholder mindst én kladde.

### Fjernet
- **`DaySummary`-komponent**: status-pills (✓ publiceret, kladder, konflikter) og avatar-stak i kollapset header er fjernet efter brugerønske — header er nu renere og kortere.


## 2026-04-29 — UI-justeringer + Daglig opsummering på DaySection (Step 3/C)

### Tilføjet
- **`DaySummary`-komponent** (`src/components/Planner/DaySummary.tsx`): vises i `DaySection`-headeren **når dagen er kollapset**. Indeholder pastel-pills med antal publicerede / kladder / konflikter samt en avatar-stak (initialer, max 5 + "+N"-overflow med tooltip-liste over resterende navne). Hver avatar har hover-tooltip med fuldt navn.

### Ændret
- **Filter-chips flyttet ind i søge-card'et**: chips ligger nu nederst i samme `<div>` som søgefelt og visningstoggles, adskilt af `border-t`. Den separate `rounded-xl`-wrapper er fjernet — sparer plads i headeren.
- **DayAbsenceRow tidsformat**: `HH:MM:SS` strippes til `HH:MM` (matcher projekt-terminologi-memory).
- **Konflikt-stripe på `AssignmentCard` fjernet**: den venstre Polygon-blå border + ring vises ikke længere — konflikter signaleres stadig via `ConflictBadge` ved siden af titlen og status-prikken.
- **"X medarbejdere"-pill**: skiftet fra klik-`Popover` til hover-`Tooltip` i `AssignmentDetails` så navnene vises ved hover (fortsat klikbar uden at åbne kortet).


## 2026-04-29 — Fraværsoverlay i DaySection + Polygon-blå medarbejder-pills (Step 2/B)

### Tilføjet
- **`DayAbsenceRow`-komponent** (`src/components/Planner/DayAbsenceRow.tsx`): viser godkendte fraværsperioder pr. dag direkte i `DaySection`-headeren. Pills viser navn (og evt. tidsinterval ved del-af-dag-fravær) med tooltip der angiver årsag. Bruger string-sammenligning på `yyyy-MM-dd` for at undgå UTC-shifts (jf. memory).
- Vises altid (også når dagen er sammenklappet) så planlæggere ser fravær uden at åbne dagen.

### Ændret — Polygon-blå farveharmonisering
- **Medarbejder-chips** (`.chip-person` + `.icon-bubble-person` i `index.css`): skiftet fra rose/violet pastel til Polygon-blå (`hsl(197 ...)`) tones — matcher brand primary.
- **Konflikt-stripe** på `AssignmentCard`: venstre `border-l` og ring skiftet fra `destructive` (rød) til `primary` (Polygon-blå) for konsistent brandfarve.
- **AssignmentDetails employee-tooltip dot**: `bg-rose-400` → `bg-primary`.

### Bibeholdt
- Konflikt-chip i `FilterChips` forbliver rose/destructive farvet — den signalerer stadig advarsel som en filterkategori.


## 2026-04-29 — Filter-chips i Planner (Step 1/A af ugeplan-udvidelser)

### Tilføjet
- **`FilterChips`-komponent** (`src/components/Planner/FilterChips.tsx`): sticky multi-select chip-række over Planner-indholdet med fem hurtige filtre: "Mine opgaver", "Ikke aftalt", "Med konflikter", "Mangler ansvarlig", "Mangler adresse". Hver chip viser et live-tæller-badge.
- **URL-state**: aktive filtre persisteres i query-paramet `?filters=mine,unpublished,...` så de overlever refresh og kan deles via link.
- **Pastel-farvekoder pr. filter**: primær (mine), amber (kladder), rose (konflikter), sky (mangler ansvarlig), violet (mangler adresse) — matcher eksisterende pill-system.
- **"Nulstil"-knap** vises kun når mindst ét filter er aktivt.
- **Tællere bygger på `useAssignmentConflicts`** så konflikt-chippet er korrekt synkroniseret med eksisterende konfliktlogik.

### Ændret
- **`PlannerPage`**: ny chip-række indsat under søgebjælken; `PlannerContent` modtager nu `chipFilteredAssignments` (sortering + chip-filtrering) i stedet for `sortedWeekAssignments`.


## 2026-04-28 — Pastel pills, Polygon favicon & sidebar centering

### Ændret
- **Sidebar header**: højde øget til `h-12`, mark + wordmark centreres med `justify-center` + `mx-auto` for perfekt balance i både collapsed (h-8) og expanded (h-7 + h-5 wordmark) tilstande.
- **Favicon**: nu `/favicon.png` baseret på Polygon-mark — bruges også til `apple-touch-icon` og `og:image`. Gamle `favicon.svg` og `favicon.ico` fjernet.
- **Pastel pill system** (`index.css`): `.chip` er nu fuldt afrundet pill (`rounded-full`). Nye tonale varianter `.chip-time` (mint), `.chip-car` (sky-blå), `.chip-person` (rose) — matcher referencedesignet. Nye `.icon-bubble` runde ikon-badges (`time`/`car`/`person`/`resp`) sidder ved siden af pillerne.
- **AssignmentDetails**: opbygget om — øverste række har tid (mint pill + grøn ikon-bubble) til venstre og personer (rose pills + lilla ikon-bubble) til højre; bil-række nedenunder med blå pills + blå ikon-bubble.
- **AssignmentCard**: flad `bg-card` (ingen gradient), sagsansvarlig vist som inline tekst med blå rund ikon-bubble — ikke længere en chip-wrapper.
- **AssignmentStatusBadge**: erstattet med custom mint pill (`Aftalt` = grøn pastel, ikke-publiceret = amber pastel).
- **CompactAssignmentRow**: tid/bil/medarbejder-kolonner bruger nu samme pastel pill-system.


## 2026-04-28 — Premium chip redesign, Polygon logo & dashboard cleanup

### Tilføjet
- **Polygon-logo i sidebar-header**: erstatter den blå `P`-flise med det officielle Polygon SVG-wordmark når sidebaren er åben. I collapsed icon-rail vises stadig den kompakte `P`-flise.
- **Neutral premium `.chip` utility** (`index.css`): én ensartet chip — neutral kortbaggrund, subtil border + indre highlight; farveakcenten kommer udelukkende fra ikonet. Modifiers `.chip-strong`, `.chip-tabular`.
- **`status-dot` utility** med `published` (grøn) / `draft` (rav) / `conflict` (rød) varianter med `box-shadow` ring mod kortbaggrund.

### Ændret
- **DashboardCockpit**: fjerner den nederste `<MineOpgaver />` (duplikat). Top-widget `WeeklyAssignments` filtreres nu personligt (sagsansvarlig ELLER koblet på som medarbejder) når `showMyTasks` er aktiv — strict ID-match.
- **VacationOverviewDropdown**: defensiv mod `vacations === undefined`. Trigger har nu permanent primær-tonet baggrund + tæller-badge (også ved 0) for tydelig synlighed i topbaren.
- **AssignmentDetails**: nyt kompakt layout — én række med tid + bil-chips, anden række med medarbejdere (≤2 inline, ellers samlet "N medarbejdere"-chip med popover).
- **AssignmentCard**: gradient-baggrund + soft border + shadow-xs. Status-dot i headeren erstatter den hårde 3px venstre-border (kun konflikter beholder rød border + ring). Sagsansvarlig vises nu som chip med indigo-ikon.
- **CompactAssignmentRow**: ensartede `text-muted-foreground` ikoner, status-dot i tidskolonnen.
- **MineOpgaver**: alle chips bruger den nye neutrale `.chip`.

## 2026-04-28 — Conflict indicator, denser navbar, mobile polish & glass chips

### Tilføjet
- **Konfliktindikator for dobbeltbooking** (`useAssignmentConflicts`, `ConflictBadge`, `utils/assignmentConflicts.ts`): registrerer overlappende tider for samme medarbejder eller samme bil i den valgte uge. Vises som rødt glass-badge med ⚠ + antal konflikter på `AssignmentCard` (planner) og `CompactAssignmentRow`. Tooltip lister navn på resource + det clashende kald (titel + tid). Kortets venstre border bliver `destructive` ved konflikt.
- **Frosted-glass chip-utilities** i `index.css`: `.chip-glass`, `.chip-glass-primary|amber|emerald|indigo|destructive` med translucent baggrund, backdrop-blur, indre highlight og farvet ring. Erstatter de tidligere flade `bg-amber-50` etc. for et mere premium look.
- **`brand-card-hover`** utility (subtil løft + shadow på hover).

### Ændret
- **AppTopBar**: højde `h-14` → `h-11`; titel `text-[13px]`; trigger-knapper `h-8 w-8`; brand-stripe `h-px` → mindre, mere diskret navbar.
- **AppSidebar**: header-højde matcher topbar (`h-11`); navigation lukker mobile sheet automatisk via `useSidebar().setOpenMobile(false)` når en ny rute vælges.
- **AssignmentDetails / MineOpgaver**: chips bruger nu de nye glass-utilities — frosted look med farvet ring i stedet for fladt fyld.
- **Mobile responsive paddings**: `DashboardPage`, `PlannerPage`, `DutyPage`, `CarsPage`, `EmployeesPage`, `VacationPage`, `WarehousePage` strammet til `px-3` / `py-3` på `< sm`.
- **DashboardCockpit aside**: sticky offset opdateret til `lg:top-14` så den følger den nye topbar-højde.


## 2026-04-28 — Color polish, role gating & navbar improvements

### Tilføjet
- **VacationOverviewDropdown** i top-navbar (`AppTopBar`) — kun synlig for Skadeleder, Administrator og Super Admin. Viser afventende ferieanmodninger med inline godkend/afvis og link til `/vacation`.

### Ændret
- **Mine Opgaver-kort** (`MineOpgaver`): tid, biler, medarbejdere og sagsansvarlig vises nu i farvede chips (primær/blå, amber, emerald, indigo) i stedet for grå tekst.
- **AssignmentDetails** (planner-kort): tid/biler/medarbejdere har fået brand-blå/amber/emerald icon-chips og badges — ikke længere fladt grå look.
- **Mine Opgaver — filtrering**: kun opgaver hvor brugeren er sagsansvarlig (`responsibleUser.id === user.id`) eller koblet på som medarbejder (legacy `employees` matcher KUN på `user.id`, ikke længere på navn). Fjerner falske matches.
- **Planner view-toggle**: Standard/Gitter/Kompakt aktiv-state bruger nu primær/brand-farve med hvid tekst.
- **Per-dag publish-knap** (`DaySection`, `CompactDaySection`): erstatter grøn med `variant="brand"` (matcher topbar). Beholder paperplane-ikon.
- **AppSidebar**: Admin-menuen flyttet til `SidebarFooter` (pinned i bunden).
- **AppShell**: sidebar er nu kollapseret som default (`defaultOpen={false}`).
- **DashboardCockpit**: `VacationNotificationsPanel` vises nu kun til admins.

### Fjernet
- **AppTopBar**: pending-vacation toast-notice (én-gang-per-session). Erstattet af permanent `VacationOverviewDropdown`.

## 2026-04-28 — Polish: Dashboard week nav, KPI states, Duty/Cars/i18n fixes

### Tilføjet
- **Dashboard ugenavigation**: `DashboardPage` har nu persistent ISO-uge-state (`dashboardSelectedWeek/Year` i localStorage) med forrige/næste-uge-knapper via `WeeklyAssignments` i venstre kolonne af cockpit'et.
- **CompactKpiStack**: accepterer nu `selectedDate` prop; KPI-modaler synkroniserer med valgt uge (mandag i ugen, eller i dag hvis aktuel uge).
- **Error state** i `CompactKpiStack` ved fejl fra `useDashboardMetrics` (rød inline-card med `common.errorLoadingData`).
- **Tomt state** i `CarsPage` når filter ikke matcher (`cars.noResults`).
- **Translation keys**: `common.errorLoadingData`, `common.noResults`, `common.selected` (EN), `cars.searchPlaceholder`, `cars.noResults`, samt 24 manglende EN-keys for `planner.*`, `vacation.*`, `notifications.title`, `admin.quickStats.total`, `admin.userManagement.inactive`, `profile.*`. DA↔EN er nu 100% balanceret.

### Ændret
- **AbsentEmployeesModal / CarAvailabilityModal**: accepterer optional `selectedDate` for fremtidig dato-kontekst.
- **CarsPage**: søgning bruger nu korrekt `number_plate` (ikke `license_plate`).
- **DutyPage**: fjernet duplikeret `min-h-screen w-full bg-background` wrapper (allerede leveret af `AppShell`'s `<main>`); løser spacing-problemer på små breakpoints.

### Fjernet
- **TopNavbar.tsx**: legacy komponent slettet (ingen importers — `AppShell` bruger udelukkende `AppTopBar`). Vakante-toast-logikken eksisterede både i `TopNavbar` og `AppTopBar`; den eneste tilbageværende kilde er nu `AppTopBar`.

---

## 2026-04-28 — UI-overhaul fase 3: Strukturelt + brand-blå signatur


Stort strukturelt overhaul. Funktionalitet uændret. Ingen DB-ændringer.

### Tilføjet
- **App-shell** (`AppShell.tsx`, `AppSidebar.tsx`, `AppTopBar.tsx`): Hybrid layout — kollapsbar ikon-sidebar + sticky 56px topbar med titel, notifikationer, ChangeLog og brugermenu. `brand-stripe` (2px) under topbaren som signatur. Mobil: offcanvas-drawer.
- **Sidebar tokens** (`index.css`, `tailwind.config.ts`): `--sidebar-*` i light + dark, registreret som `sidebar.{primary,accent,border,ring}`.
- **Brand utilities**: `.brand-stripe`, `.brand-card-header`, `.brand-dot`, `.kpi-number`, `.list-row-selected`, `.btn-premium-inset`.
- **Dashboard cockpit** (`DashboardCockpit.tsx`, `CompactKpiStack.tsx`): To-kolonne arbejdsbord — venstre 2/3 (MineOpgaver + QuickAccess), højre 1/3 sticky-panel (KPI-stack + Duty + Vacations). KPI'erne er nu kompakt vertikal liste med store blå tal.
- **List-shell primitiver** (`ListPageShell.tsx`, `SegmentedFilterBar.tsx`): Genbrugelig side-skal med titel, actions, sticky filter-bar med segmenter + tæller-badges + søgning.

### Ændret
- **MainLayout**: Bruger ny `AppShell` i stedet for fixed `TopNavbar`.
- **DashboardPage**: Konsolideret rendering via `DashboardCockpit`.
- **WelcomeHeader**: 1px primary venstre-stripe + uge-tal i `text-primary`.
- **EmployeesPage**: Refaktoreret til `ListPageShell` + segmenter (Alle / Aktive / På fridage / Vikarer) + søgning på navn/email/titel.
- **CarsPage**: Refaktoreret til `ListPageShell` + segmenter (Alle / Tilgængelige / Optaget) + søgning.
- **VacationPage, WarehousePage**: Konverteret til `ListPageShell`-pattern.
- **DutyPage**: Header standardiseret til fælles typografi.
- **Tabs primitive**: Active state bruger `bg-primary text-primary-foreground`.
- **Table primitive**: TableHeader er `bg-primary/5` + `sticky top-0`.
- **Button primitive**: Default-variant fik `inset 0 1px 0 rgba(255,255,255,0.18)` for premium dybde.

### Verificeret
- TypeScript-build clean.
- Multi-tenant query-isolation intakt (ingen hook-ændringer).
- Dark mode: Sidebar-tokens har separate HSL-værdier; brand-card-header bruger `/0.06` for at undgå glow.
- Vacation pending-toast logik flyttet fra TopNavbar til AppTopBar med samme session-storage gate.

---

## 2026-04-28 — UI-overhaul fase 2: Planner + dokumentation


Fortsætter Apple/Arc-overhaul fra fase 1. Funktionalitet uændret. Ingen DB-ændringer.

### Ændret
- **PlannerPage** (`src/pages/PlannerPage.tsx`): Erstattet primary-gradient header med blur-orbs af clean layout — `bg-primary/10`-ikon, neutral titel, segmenteret week-navigator (`rounded-lg border border-border bg-card`). Fjernet `bg-[#f8fafc]`, `animate-fade-in-up`, `backdrop-blur-sm`, hvide overlay-pile. View-toggle bruger nu `data-[state=on]:shadow-xs`. Loading/error-tilstande standardiseret til `bg-background` og `text-destructive`.
- **AssignmentCard** (`src/components/Planner/AssignmentCard.tsx`): Fjernet `hover:bg-blue-50/50` (nu `hover:bg-accent/40`), `animate-pulse hover:animate-none` på lager-pill, `text-blue-600` på responsible-icon (nu `text-primary`), `text-yellow-600` på debug (nu `text-amber-600`). Status-stripe er nu `border-l-emerald-500` / `border-l-amber-400`.
- **AssignmentDetails** (`src/components/Planner/AssignmentDetails.tsx`): Erstattet farvede icon-pills (`bg-green-50/border-green-200`, `bg-blue-50`, `bg-purple-50`) med ensartet `bg-muted text-muted-foreground`. Tabular-nums på tider, `font-normal` på badges, dark-mode varianter på "delt bil"-advarsel.
- **AssignmentDetailsDialog** (`src/components/Dashboard/AssignmentDetailsDialog.tsx`): Header bruger `bg-card` (var `bg-gradient-to-b from-muted/30`). Detaljerækker er nu `rounded-lg border border-border bg-muted/40` med neutrale `text-muted-foreground` ikoner i stedet for `text-primary`. Messages-sidebar bruger `bg-muted/20` (var `bg-gradient-to-b`).
- **EmployeesPage** (`src/pages/EmployeesPage.tsx`): Konverteret fra inline `text-2xl font-bold`-titel til `<PageHeader>` for konsistens med Cars/Vacation/Warehouse. Tabel-container bruger nu `rounded-xl border border-border shadow-xs`.
- **Dokumentation** (`docs/ui-guidelines/design-system.md`): Komplet revision. Tilføjet sektioner for designprincipper, token-tabeller (radius/shadows/farver), standardmønstre per komponent-type, anti-patterns og reference-implementationer. Erstatter den tidligere version.

### Verificeret
- Dark mode: Header, kort, dialog og toolbar har korrekt kontrast.
- Funktionalitet: Week-navigation, view-toggle, expand-all, dialogs uændrede.
- Fase 1-konsistens: Cars/Vacation/Warehouse/Employees bruger nu identisk side-layout (`PageHeader` + `rounded-xl border border-border bg-card shadow-xs`).

---

## 2026-04-28 — Globalt UI-overhaul (fase 1: foundation + base + dashboard)

Stort visuelt overhaul mod et roligt, premium "Apple/Arc"-look. Funktionalitet uændret. Brand-farver og logo bevaret.

### Ændret
- **Design tokens** (`src/index.css`, `tailwind.config.ts`): Ny radius-skala (10px), kalibrerede shadow-tokens (xs/sm/md/lg/xl), strammere typografi-skala, polerede dark-mode-farver. Fjernet `gradient-primary`, `glass-effect`, `text-gradient`, `hover-lift`, `hover-glow`, `interactive-scale`, `pulse-glow`, `shimmer`, `bounce-gentle`, `float`, `glow`-skygger og `modern-*`-utilities.
- **Base UI**: `Button`, `Input`, `Card`, `Dialog`, `Badge` — fjernet hover-translateY, before-shimmer, store skygger, tunge borders, backdrop-blur på inputs. Konsistent rolig fokus-ring, neutrale hover-tilstande.
- **Layout**: `MainLayout`, `TopNavbar`, `PageHeader`, `RouteLoadingFallback` — fjernet gradient-baggrunde og glassmorphism. PageHeader er nu en flad titel + Separator.
- **Dashboard**: `WelcomeHeader`, `QuickAccessGrid`, `MetricCard`, `InteractiveMetricCard`, `DutySummaryWidget`, `WeeklyAssignments` — fjernet primary-gradient headere, blur-orbs, farverige ikon-bokse, `border-l-4`-accenter erstattet af tynd 3px-stribe via `::before`.
- **Sider**: `LoginPage`, `Index`, `CarsPage`, `VacationPage`, `WarehousePage`, `DashboardPage` — fjernet gradient-baggrunde og store glassy headers; standardiseret til `bg-background` + `PageHeader`.

### Bevaret
- Primær brand-farve `#00aeef`, Polygon-logo, dansk terminologi, semantiske farve-tokens, høj informationstæthed (`p-4 gap-4`, `rounded-xl`), sticky dialog header/footer, multi-tenant logik.

### Næste fase (planlagt)
- PlannerPage, ScreenDisplayPage, AssignmentCard, CompactAssignmentRow, UnassignedResourcesSection, DutyWeekWidget, AssignmentDetailsDialog, EmployeesPage, DutyPage, AdminPage — samme behandling.
- Dark-mode QA-pass på alle opdaterede komponenter.
- Opdater `docs/ui-guidelines/design-system.md`.

## 2026-04-28 — UX-fixes + UI overhaul fase 3

### UX
- **Login**: Personlig hilsen "Velkommen tilbage, {fornavn}" baseret på cachet `last_user_name` i localStorage (gemmes i `AuthContext` efter vellykket profil-fetch).
- **Password-felt**: Native browser-øje skjult via CSS (`::-ms-reveal`, `::-webkit-credentials-auto-fill-button`) — kun appens egen toggle vises nu. Påvirker både login, password reset og `PasswordInput`.
- **Series-prompt**: `PlannerPage` viser kun `SeriesActionDialog` ved redigering/sletning hvis `findSeriesSiblings(...).length > 1`. En enlig sag (fx 12-013700) går direkte til normal edit/delete uden prompt.
- **Selectors**: `CarSelector` udvidet fra `w-80` → `w-[420px]`, `EmployeeSelector` fra `w-96` → `w-[480px]` (med `max-w-[calc(100vw-2rem)]` for små skærme).

### Auto-refresh
- Ny helper `src/lib/realtimeUtils.ts` (`notifyOwnAction`) som dispatcher `supabase-own-action`-event.
- `MainLayout` invaliderer React Query-caches ved hver route-ændring (assignments, employees, cars, vacations, duties) og dispatcher own-action samtidig — fjerner unødvendige "Opdater"-bannere ved navigation.
- `notifyOwnAction()` tilføjet ved start af alle mutationer i: `useOptimizedAssignments` (create/update/updateSeries/delete/deleteByGroup/detach/publish/publishByDate), `useEmployeeActions` (create/update/delete/toggleLeave), `useCarActions` (confirmDelete/updateAvailabilityStatus), `useVacationActions` (submit/delete/approve/reject), `useDutyActions` (assign/update/reassign/swap/swapDuties).

### UI overhaul (fase 3)
- `MainLayout`: fjernet `animate-fade-in-up` wrapper ved hver navigation.
- `TopNavbar`: fjernet `bg-background/85 backdrop-blur-md` → flat `bg-background`.
- `Dialog overlay`: fjernet `backdrop-blur-[2px]`.
- `Toast`: fuld redesign — fjernet `rounded-2xl`, `border-2`, `bg-background/95 backdrop-blur-xl`, `shadow-2xl`, `hover:scale-[1.02]`, `before:` gradient. Nu: `rounded-xl border border-border bg-card shadow-md p-4`.
- `Table` ui-primitiv: standardiseret `TableHeader` (`bg-muted/40`), `TableHead` (`h-10 text-xs uppercase tracking-wide`) og `TableRow` (`hover:bg-accent/40`) — ramler igennem i Cars, Employees, Vacation, Duty.
- Fjernet alle `bg-gradient-to-br from-gray-*` og lignende lovable-rester fra: `Index.tsx`, `App.tsx`, `GlobalErrorBoundary`, `DashboardErrorBoundary`, `ScreenDisplayErrorBoundary`, `ScreenDisplayPage` (3x), `FalckSubscriptionButton`, `AssignmentForm`, `UnassignedResourcesSection`, `DutyWeekWidget`, `ScreenDisplayHeader`, `ScreenDisplayContent`.
- `EnhancedSecureLoginForm`: ryddet `Card`-overrides (`shadow-lg rounded-xl border-border/50`).
- `Button`: fjernet legacy `gradient` og `glass`-aliaser.

### Tokens
- `index.css`: tilføjet globale CSS-regler der skjuler native browser password-reveal-knapper, så kun appens egen øje-toggle vises.
## 2026-05-18 — StatusTimeline i18n
- StatusTimeline bruger nu `changeLog.operations.*` og ny `changeLog.history` nøgle i stedet for hardkodede da/en strenge.
- Tilføjet `operations.COMPLETE` og `history` i både da og en translations.

## 2026-05-20 screen-display absences
- Storskærmvisning: Header viser nu orange badge med antal og navne på fraværende medarbejdere for den valgte dag (godkendt ferie + on_leave/inaktiv), hele afdelingen.

## 2026-06-04 - PCB-bevis tilføjet
- Nyt certifikatfelt `has_pcb_certificate` på medarbejdere (profiles)
- Vist i medarbejderform, tabel (FlaskConical-ikon) og mobilkort
- Oversættelser DA/EN tilføjet

- Screen-display: catch-up auto-jump til i dag ved tab visibility/focus, så kiosk-skærmen altid viser dagens dato efter sleep.

## 2026-06-10 - Screen Display viser sagsansvarlig og bil
- RPC `list_screen_display_assignments` returnerer nu bilnavne (jsonb).
- Kort på storskærm viser sagsansvarlig (skadeleder) og hvilken bil/trailer der skal bruges.

## 2026-06-16
- Erstattede måneds-kalender på /vacation "Ferieoversigt" med grid-visning (medarbejdere som rækker, dage som kolonner, ræde celler = godkendt ferie). Bruger vælger selv periode (maks 92 dage), sticky navnekolonne, uge-nummer-header.
