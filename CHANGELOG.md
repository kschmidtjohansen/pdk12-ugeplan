# Changelog

## [Unreleased] - 2026-03-02

### Fixed — PDF-upload fejler stille ved specialtegn i filnavn
- **Filnavn-sanitering**: Udvidet til ASCII-only med NFD-normalisering — danske tegn (æ, ø, å) og alle ikke-ASCII tegn konverteres nu korrekt. Løser at filer med danske bogstaver i navnet fejlede stille i Supabase Storage.
- **Persistent fejl-toasts**: Upload-fejl vises nu i 8 sekunder så brugeren ikke overser dem.
- **Upload-verifikation**: Efter DB-insert verificeres det at filen faktisk blev gemt, med fejlbesked hvis ikke.

### Fixed — Filuploads (PDF) vises ikke + automatisk UI-opdatering
- **Upload fejlhåndtering**: Viser nu den faktiske fejlbesked fra Supabase i stedet for generisk "Kunne ikke uploade fil". Orphaned storage-filer ryddes op hvis DB-insert fejler.
- **Mime-type fallback**: Hvis browseren ikke angiver mime_type (f.eks. visse PDF-filer), bruges `application/octet-stream` som fallback.
- **Auto-refresh efter upload**: Filter nulstilles til "Alle filer" efter upload, så den nyuploadede fil altid er synlig uden at lukke og genåbne opgaven.
- **Supabase-own-action dispatch**: Upload dispatcher `supabase-own-action` event for at undgå global RealtimeChangeNotifier-banner ved egne handlinger.
- **Storage policies for super_admin**: `storage.objects` DELETE/UPDATE policies bruger nu `is_admin_or_skadeleder()` som inkluderer `super_admin`-rollen.

### Fixed — Vagtoprettelse fejler for super_admin + fejlhåndtering
- **RLS Policy**: `on_call_duties` politikken "Admin and skadeleder can manage all duties" bruger nu `is_admin_or_skadeleder()` i stedet for inline role-check der manglede `super_admin`.
- **RLS Policy**: `planner_change_log` politikken "Admin and Skadeleder can view logs" opdateret tilsvarende.
- **Fejlhåndtering**: `useDutyActions.ts` håndterer nu PostgrestError korrekt (`.message` udtrækkes uden `instanceof Error`).
- **DutyEmployeeSelector**: `super_admin` inkluderet i filteret for skadeledervagt, så brugere med super_admin-rolle nu vises korrekt.
- **DB Trigger**: `validate_duty_assignment` trigger-funktionen inkluderer nu `super_admin` i rolle-tjekket for skadeledervagt, så super_admins kan tildeles vagter.

## [Unreleased] - 2026-02-24

### Fixed — Lagerlokation viser ID + manglende oversættelse i Biler
- **Warehouse location fallback**: `useLocationLabel` i `WarehouseTableRow` og `MobileWarehouseCard` viser nu formaterede navne (f.eks. "Hal 1") i stedet for rå nøgler (f.eks. "hal_1") når localStorage-data ikke er tilgængelig.
- **Oversættelser**: Tilføjet manglende `common.showMore` og `common.showLess` til både dansk og engelsk.

### Audit — Total 360-graders Audit (Fase 13)
- **Kode-hygiejne**: Alle uguardede `console.log`/`console.error` i produktionskode wrappet i `import.meta.env.DEV` guard (notificationCreate, notificationFetching, dutyNotifications, AuthContext, PullToRefresh).
- **Mobil UX**: Verificeret — selectors bruger Drawer på mobil, Popover modal på desktop. Ingen overlap i opgavevisning.
- **Data-isolation**: Verificeret — alle 7 moduler (Dashboard, Planner, Employees, Cars, Vacation, Duty, Warehouse) filtrerer på `department_id`.
- **RLS Policies**: Verificeret — alle tabeller har RLS aktiveret med korrekte SECURITY DEFINER funktioner.
- **Session Management**: Verificeret — logout rydder queryClient, service-caches, sessionStorage og app-specifikke localStorage-nøgler.
- **Haversine**: Verificeret — 15km radius-beregning fungerer korrekt med DAWA-koordinater.
- **search_path**: Verificeret — alle SECURITY DEFINER funktioner har `SET search_path = public`.

### Fixed — Afdelingsfiltrering på ferie-notifikationer og rød label
- **useVacationRequestsStatus**: Tilføjet `department_id`-filter fra `useDepartment()` — rød prik på "Fridage" i navbar vises nu KUN for pending ansøgninger i den valgte afdeling.
- **vacationNotifications**: Tilføjet `department_id`-filter — notifikationer oprettes nu KUN for pending ansøgninger i den valgte afdeling. Guard tilføjet så notifikationer springes over hvis ingen afdeling er valgt.

## [Previous] - 2026-02-23

### Fixed — Desktop scroll i selectors (modal Popover)
- **EmployeeSelector, MultipleCarSelector, CarSelector, ResponsibleUserSelector**: Desktop Popover ændret fra `modal={false}` til `modal={true}`. Løser scroll-blokering inde i Dialog-kontekst ved at lade Radix Popover neste sin `RemoveScroll` korrekt med Dialogens `RemoveScroll`. `onPointerDownOutside`-handler fjernet (unødvendig med `modal={true}`).
- **Beskrivelse for alle roller**: Verificeret at `AssignmentDetailsDialog` ikke har rolle-baserede begrænsninger på beskrivelsen — alle roller (Servicemedarbejder, Skadeleder, Administrator) kan se beskrivelsen fuldt ud.

### Fixed — PullToRefresh: Ignorerer touch i Drawers/Dialogs
- **PullToRefresh.tsx**: `handleTouchStart` tjekker nu om touch stammer fra `[data-vaul-drawer]`, `[data-vaul-overlay]` eller `[role="dialog"]` og ignorerer i så fald eventet. Forhindrer at swipe-ned i en åben Drawer/Dialog udløser pull-to-refresh.

### Fixed — Planner: Mobil-scroll i selectors (Drawer-løsning)
- **Drawer på mobil**: EmployeeSelector, MultipleCarSelector, CarSelector og ResponsibleUserSelector bruger nu `Drawer` (vaul) på mobil i stedet for `Popover`. Drawer har fuld overlay og native scroll — eliminerer pull-to-refresh og touch-leak fuldstændigt.
- **Desktop uændret**: Popover med `modal={false}` beholdt på desktop.
- **Liste-indhold delt**: Renderlogik extraheret til `renderXxxList()` funktioner så indholdet ikke duplikeres mellem Drawer og Popover.

### Fixed — Planner: Bil-valg, Scroll og Mobil-overlap (Afd. 14)
- **MultipleCarSelector (double-toggle fix)**: Fjernet `htmlFor` fra `<label>` og `onChange` fra checkbox — klik på hele bil-rækken toggler nu korrekt én gang i stedet for to (som annullerede hinanden).
- **EmployeeSelector (scroll-fix)**: Erstattet `DropdownMenu` med `Popover modal={false}` — fjerner Radix focus-trapping der blokerede scroll i Dialog-kontekst. Native scroll med `onWheel stopPropagation` virker nu på både desktop og mobil.
- **CarSelector (single)**: Tilføjet `modal={false}` på Popover — matcher MultipleCarSelector-fix.
- **AssignmentDetailsDialog (mobil-overlap)**: Ændret besked-panel fra `h-[350px]` til `min-h-[300px] max-h-[50dvh]` for fleksibel højde. Tilføjet `flex-shrink-0` på beskrivelses-sektion.
- **AssignmentForm (DEV-guard)**: Console.log på title/location/time/description-handlers wrappet i `import.meta.env.DEV`-guard.
- **EmployeeSelector (DEV-guard)**: Console.error i catch-blokke wrappet i `import.meta.env.DEV`-guard.

## [Unreleased] - 2026-02-23

### Fixed — Planner: Car Selector lukker uden at vælge bil
- **MultipleCarSelector (Popover-i-Dialog fix)**: Tilføjet `modal={false}` på Popover og `e.stopPropagation()` på klik-handlers, så Radix Dialog ikke lukker Popover ved bilvalg.
- **MultipleCarSelector (design-system)**: Hardcoded farver (`bg-white`, `bg-gray-50`, `text-gray-400`, `border-gray-200`) erstattet med semantiske tokens (`bg-popover`, `bg-muted`, `text-muted-foreground`, `border-border`). Dark mode-varianter tilføjet på status-badges.

### Fixed — Planner: Multi-dag opgaveoprettelse
- **AssignmentForm (timezone-fix)**: `selectedDates`-mapping brugte `new Date(d)` der fortolker ISO-datostrenge som UTC midnat, hvilket forårsagede et dag-offset på europæiske browsere (UTC+1). Rettet til lokal dato-konstruktion: `new Date(y, m-1, day)`.
- **AssignmentForm (valideringsfix)**: Datovalidering ved submit tjekkede kun `formData.date` og ignorerede `dates`-arrayet. Opdateret til at tjekke begge — konsistent med multi-dag forventninger.
- **AssignmentForm (kodekvalitet)**: Alle `console.log`/`console.error` wrappet i `import.meta.env.DEV`-guard jf. tekniske specs.

### Fixed — Security: Multi-tenant isolation (kritisk)
- **Database (data-fix)**: Opgave `14-000686` (ID: `792649a1-...`) havde `department_id = NULL`, hvilket medførte at den var synlig i alle afdelinger. Rettet til korrekt afdeling 14 - Asnæs (`63d46993-...`).
- **RPC `list_accessible_assignments_with_team`**: Fjernet `OR a.department_id IS NULL` fra WHERE-betingelsen i begge grene (administrator/skadeleder og servicemedarbejder). Opgaver uden `department_id` vises nu kun når ingen specifik afdeling er valgt. Forhindrer fremtidige cross-tenant lækager.
- **Frontend guard** (`useOptimizedAssignments.createAssignment`): Kast fejl hvis `selectedDepartmentId` er null og brugeren ikke er i demo-mode. Forhindrer stiltiende gemning af opgaver med `department_id: null`.

### Fixed — UI: View-toggle skjult på mobil
- **PlannerPage**: Standard/Kompakt/Gitter-view-toggle vises nu kun fra `sm`-breakpoint.

## [Unreleased] - 2026-02-19

### Fixed — Mobilvisning: Scroll i opgavedetaljer
- **AssignmentDetailsDialog**: Fjernet nestede scroll-containere (ScrollArea + overflow-y-auto) på mobil, så beskrivelsen og alle sektioner kan scrolles korrekt. Desktop-layout uændret.
- **AssignmentDetailsDialog**: Besked-panelet overlappede beskrivelsen på mobil — fjernet `flex-1` på mobil fra ydre wrapper og indre detalje-container (bruger nu `lg:flex-1`), tilføjet `whitespace-pre-wrap break-words` på beskrivelsestekst. Mobil: naturlig højde på alle sektioner, scroll via DialogContent. Desktop uændret.
- **AssignmentDetailsDialog**: Endelig robust fix — fjernet `min-h-0` på mobil (kun `lg:min-h-0`), tilføjet `h-auto flex-shrink-0` på venstre kolonne så den aldrig krympes, og `pb-4` på beskrivelses-container for luft. Sikrer fuld læsbarhed af lange beskrivelser uden overlap.

## [Unreleased] - 2026-02-17

### Changed — Login UI-renovering + Favicon
- **SVG Favicon**: Nyt `public/favicon.svg` med kun ikon-delen af Polygon-logoet (grå ydre form + blå gradient-cirkel, uden "POLYGON"-tekst). Giver skarpt favicon i alle størrelser.
- **Login-baggrund**: Subtil gradient fra `background` til `muted/30` erstatter flad `bg-muted/50`.
- **Login-tekst**: "Velkommen tilbage" (text-2xl, semibold) + "Log ind på din ugeplan" (text-sm, muted). Afdelingsnavn vises diskret hvis tilgængeligt.
- **Login-card**: `shadow-lg`, `rounded-xl`, `border-border/50` for moderne SaaS-look.
- **Fade-in animation**: Container og fejlbeskeder bruger `animate-fade-in`.
- **Fejlbeskeder**: Oversat forsøgs-advarsel (fjernet hardcoded engelsk). DEV-guard på `console.error`.
- **Oversættelser**: Nye nøgler `loginSubtext` og `failedAttempts` i DA/EN.


### Added — Fase 12: Total Master Audit + Session-timeout
- **Session-timeout (180 min)**: Brugere logges automatisk ud efter 180 minutters session. Cachen (TanStack Query, LocalStorage, SessionStorage, service-caches) ryddes fuldstændigt ved timeout — eliminerer databrud ved lange browsersessioner. Demo-brugere undtages. Toast-besked vises ved timeout.
- **Oversættelsesnøgler**: `auth.sessionTimedOut` og `auth.sessionTimedOutDescription` tilføjet i DA/EN.

### Changed — Fase 12
- **Login-tekst**: Overskrift ændret til "Ugeplan" (uden "Velkommen til"). "Internt planlægningssystem" fjernet.
- **Login-logo**: Polygon-logo forstørret fra h-12 til h-20 på login-siden.
- **EmployeeSelector statuslabels**: Hardcodede engelske 'Expired'/'Terminated'/'Inactive' erstattet med `t()` oversættelsesnøgler.
- **Realtime schema-fix**: `useVacationRequestsStatus` lytter nu altid på `schema: 'public'` (fjernet ugyldig `demo`-schema routing).
- **DEV-guards**: Wrappet uguardede `console.log/warn/error` i 6 filer: `useVacationRequestsStatus`, `useCarDataHandler`, `enhancedDataFetching`, `enhancedUnifiedDataService`, `supabaseIssuesAuditor`, `use-toast`.

### Changed
- **Fjernet duplikat-validering på brændstofkortkoder**: Valideringen der blokerede for at gemme en bil, hvis `fuel_card_code` allerede var i brug af en anden bil, er fjernet. I Afdeling 14 (Asnæs) er det en gyldig forretningsregel at alle biler deler samme kortkode. Feltet er nu et simpelt fritekstfelt uden begrænsninger.
- **Oprydning i `CarFormDialog`**: `cars`- og `currentCar`-props fjernet fra `CarFormDialog` da de udelukkende tjente duplikat-tjekket.

## Security Hardening - February 2026

### Fixed - 2026-02-17 (Bil forsvinder ved redigering — department_id nulstilles)
- **`department_id` fjernet fra `updateCar`-payload**: `CarSecurityService.updateCar` overskrev tidligere altid `department_id` med `NULL` ved redigering, fordi `CarFormData` ikke indeholder dette felt. Feltet er nu fjernet fuldstændigt fra `updateData`, så databasen altid bevarer den eksisterende værdi.
- **Bil 04 (Asnæs, afd. 14) rettet i databasen**: Migration har gendannet korrekt `department_id` på bil 04.
- **Duplikat-validering for brændstofkortkode**: `CarFormDialog` viser nu en rød advarsel og disabler Gem-knappen hvis `fuel_card_code` allerede bruges af en anden bil i afdelingen.

### Fixed - 2026-02-17 (Total Isolation Audit)
- **Ferie-oprettelse injicerer nu department_id**: Nye ferieansøgninger får automatisk `department_id` og `sub_department_id` fra den aktive session. Forhindrer ferier med `NULL`-afdeling der potentielt kan lække på tværs af centre.
- **PlannerPage "Vis på skærm" sender departmentId**: Knappen videresender nu `departmentId` og `subDepartmentId` via URL-parametre til skærmvisningen, så den kun viser opgaver for den aktive afdeling.

### Fixed - 2026-02-17 (Global State Reset ved Logout)
- **LocalStorage ryddes ved logout**: Nøgler som `selected_department_id`, `selected_sub_department_id`, `selected_department_name`, `selected_view` og dynamiske `location-data-*` fjernes nu ved logout. Theme-indstilling (`ui-theme`) bevares.
- **Fuld page reload efter logout**: `window.location.href` bruges i stedet for React Router `navigate()`, så alle Contexts (DepartmentContext, NotificationContext osv.) geninitialiseres fra scratch. Forhindrer data-lækage mellem brugere.

### Fixed - 2026-02-17 (Usynlige biler i Afdeling 14)
- **5 biler med manglende department_id rettet**: Bil 08, 09, 02, 03 og Test i Afdeling 14 havde `department_id = NULL` og var derfor usynlige. Rettet via database-opdatering.
- **Forbedret underafdelingsfiltrering**: Biler uden specifik underafdeling vises nu også når man ser en underafdeling (hierarkisk arv). Tidligere returnerede systemet en tom liste.

### Fixed - 2026-02-17 (Skærmvisning afdelingsfilter)
- **Skærmvisning viste data fra forkert afdeling**: "Vis på skærm"-knappen sendte ikke `departmentId` med i URL'en, så `ScreenDisplayPage` hentede opgaver fra alle afdelinger. Nu sendes `departmentId` og `subDepartmentId` via URL-parametre og filtreres korrekt i servicelaget.

### Fixed - 2026-02-17 (Lokation property-mismatch)
- **Lokationer usynlige i lagermodulet**: `LocationManagement` gemmer lokationer som `{ key, label }`, men lagerkomponenterne læste `{ id, name }`. Rettet mapping i `WarehouseFormDialog`, `WarehouseTableRow` og `MobileWarehouseCard` så begge formater understøttes.

### Fixed - 2026-02-17 (Multi-Tenant Isolation)
- **Gennemgribende afdelingsfiltrering**: Alle data-hooks (medarbejdere, lager, opgaver, ferie, vagter) venter nu på at `selectedDepartmentId` er sat, før queries køres. Forhindrer data-lækage ved appstart.
- **Fjernet NULL-lækage på ferie**: `department_id IS NULL`-inkludering fjernet fra ferieforespørgsler — ferier vises nu kun i den afdeling de eksplicit tilhører.
- **Fjernet NULL-lækage på vagter**: `department_id IS NULL`-inkludering fjernet fra vagtforespørgsler — vagter isoleret strengt per afdeling.
- **Demo-tilstand**: Demo-brugeren bypasser afdelingsventetid korrekt og bruger sin egen isolerede logik.


### Fixed - 2026-02-17
- **Afdelingsfiltrering på biler**: Car-query venter nu på `selectedDepartmentId` før den køres — afdeling 14 ser kun sine egne biler, ikke alle biler på tværs af afdelinger.
- **Dynamiske lagerlokationer**: Hardkodede "Hal 1"/"Sort Hal" erstattet med dynamiske lokationer fra localStorage per afdeling. Formularen viser en Select-dropdown med afdelingens lokationer. Tabel og mobilkort slår lokationsnavne op dynamisk.

### Fixed - 2026-02-17
- **Streng afdelingsfiltrering på biler**: Fjernet `department_id IS NULL`-inkludering fra bilforespørgsel — biler vises nu kun i den afdeling de eksplicit tilhører. Biler uden afdeling skal tildeles via admin.
- **Brændstofkortkode valgfri og ikke-unik**: `fuel_card_code` er nu nullable med default NULL. Unique constraint `unique_fuel_card_code_per_dept` er fjernet. Feltet er ikke længere påkrævet i formularen. Eksisterende AUTO-placeholders er konverteret til NULL.
- **Duplikeret fuel_card_code blokerer biloprettelse**: Brugere uden adgang til brændstofkort-feltet fik tom streng som fuel_card_code, hvilket udløste unique constraint-fejl ved oprettelse af anden bil i samme afdeling. Genererer nu en unik placeholder-værdi (AUTO-...) i stedet.
- **Biloprettelse fejlhåndtering**: Sub-department sync-fejl afbryder ikke længere hele oprettelsen (bilen var allerede gemt). Fjernet dobbelt fejlbesked — kun én toast vises nu ved fejl.

- **Medarbejder afdelingstilknytning**: Nye medarbejdere oprettes nu med `user_access`-record og `home_department_id` baseret på den aktive afdeling — vises straks i korrekt afdeling i stedet for "Uden afdeling".
- **Cache-lækage ved brugerskift**: TanStack Query-cache, unifiedDataService, OptimizedAssignmentService og enhancedDataFetching ryddes nu eksplicit ved logout — forhindrer at cached data fra bruger A vises efter login som bruger B.
- **Manglende tidsinput i opgaveformular**: Fra-tid og til-tid inputfelter tilføjet til AssignmentFormFields — props var modtaget men aldrig renderet i JSX.

### Fixed - 2026-02-17 (Login & Lager)
- **Login afdelingsvisning**: Afdelingsnavn gemmes nu i localStorage ved afdelingsskift, så login-siden kan vise seneste afdeling uden RLS-blokeret DB-query. Fallback til "Internt Planlægningssystem" ved første login.
- **Login-side semantiske farver**: Hardcoded gray-klasser erstattet med tema-tokens (bg-muted/50, text-foreground, text-muted-foreground).
- **Lager adresse-autocomplete**: DAWA adresse-autocomplete tilføjet til lagerformularen (WarehouseFormDialog) — genbruger AddressAutocomplete-komponenten fra planlæggeren.

### Fixed - 2026-02-17
- **360-graders Gennemgang — Pilot-klar Uge 10**:
  - **LOGGING**: DEV-guard på ~50 uguardede `console.log/error` i 14 filer — forhindrer PII-lækage i produktion (MainLayout, useScreenDisplayData, MineOpgaver, AssignmentActionButtons, useEmployeeStatus, useVacationCleanup, VacationCleanupHandler, PasswordResetDebugger, SecurityErrorBoundary, useEmployeeData, ProfilePictureDialog, useAssignmentHelpers, useDemoTracking)
  - **UI**: Erstattet ~30 hardcoded `gray-*` Tailwind-klasser med semantiske tema-tokens (`text-muted-foreground`, `bg-muted`, `border-border`, `hover:bg-accent`) i 10 filer (EmployeesTable, VacationPage, VacationTable, password-input, secure-input, status-badge, SecurityErrorBoundary, PasswordResetDebugger, DemoRoleSwitcher, ImageCropper)
  - **DOCS**: tasks.md opdateret med lokationsisolering (Fase 10c) og 360-graders gennemgang (Fase 11)

### Fixed - 2026-02-16
- **Manglende oversættelser for lokationsstyring**: Tilføjet `addPlaceholder`, `add`, `alreadyExists` og `added` nøgler til `admin.locations` i både da/en sprogfiler. Beskrivelsen opdateret til at reflektere per-afdeling-scope.
- **Lokationer fuldt isoleret per afdeling**: Hardcodede default-lokationer fjernet. Hver afdeling starter nu med en tom liste og lokationer oprettes eksplicit via "Tilføj lokation"-knap. Lokationer gemmes i localStorage per afdeling, så Afd. 16 ikke arver lokationer fra Afd. 12.
- **Afdelingstilknytning ved brugeroprettelse**: Formularen pre-selecter nu den aktive afdeling automatisk, så nye brugere altid tilknyttes mindst én afdeling. Validering forhindrer oprettelse uden afdelingsvalg.

### Fixed - 2026-02-16
- **Nærmeste-fix edit-mode**: Auto-fetch af GPS-koordinater fra postnummer ved redigering af opgave — proximity-sortering virker nu også i edit-mode
- **Top-3 grøn visning**: De 3 nærmeste medarbejdere (inden for 15 km) vises med grøn tekst og MapPin-ikon, øvrige i standard grå

### Changed - 2026-02-16
- **UI/UX Refactoring**: EmployeeSelector og CarSelector redesignet med luftig padding (py-3 px-4), neutrale hover/valg-farver (bg-accent/50, bg-accent/30), tynde separatorer (border-border/40). Proximity vises som diskret sub-tekst med MapPin-ikon i stedet for grøn badge. CarSelector viser nummerplade som sub-tekst og bruger Car-ikon. Røde rammer og "Valgt"-badges fjernet.
- **Design System**: Ny "List Item (Dropdown/Selector)" sektion tilføjet i `docs/ui-guidelines/design-system.md`

### Fixed - 2026-02-16
- **Nærmeste-fix**: Backfill af GPS-koordinater for eksisterende medarbejdere med postnummer men uden lat/lng — kører automatisk i baggrunden ved app-start
- **Edit-mode koordinater**: Opgaveformularen initialiserer nu `caseLat`/`caseLng` fra eksisterende opgavedata, så nærmeste-badges vises korrekt ved redigering

### Optimized - 2026-02-16
- **15 km Radius Optimering**: Erstattet postnummer-baseret nærhedssortering med præcis GPS-afstandsberegning via Haversine-formlen. Medarbejdere inden for 15 km vises øverst med grøn badge og MapPin-ikon med præcis afstand (f.eks. "Nærmeste (8,4 km)"). Koordinater hentes direkte fra DAWA autocomplete-svaret.
- **DAWA koordinater direkte**: Koordinater udtrækkes nu direkte fra DAWA autocomplete-svaret (`adgangspunkt.koordinater`) — fjerner overflødigt API-kald ved adresse-valg. Fallback via `fetchPostnrCoords` beholdes for manuelt input.

### Added - 2026-02-16
- **GPS-koordinater**: Tilføjet `lat` og `lng` (float8) kolonner til `profiles` og `assignments` tabellerne
- **DAWA postnummer-opslag**: `dawa-proxy` Edge Function understøtter nu `?postnr=7120` for at hente GPS-koordinater fra `visueltcenter`
- **Automatisk koordinat-hentning**: Når en medarbejder gemmes med postnummer, hentes GPS-koordinater automatisk fra DAWA API
- **Ny hook**: `useDawaPostnrLookup.ts` — `fetchPostnrCoords(postnr)` returnerer `{ lat, lng }` eller `null`
- Opgaver gemmer nu `lat`/`lng` ved oprettelse og opdatering
- `admin-create-user` Edge Function gemmer nu `home_postcode`, `home_address`, `lat`, `lng`
- Dokumenteret i `docs/technical-specs/database-schema.md` under "GPS-koordinater"

### Changed - 2026-02-16
- **Adresse-visning**: DAWA autocomplete viser nu fuld adresse inkl. postnummer og by (f.eks. "Julianelund 8, 7120 Vejle Øst")
- **Samlet adresse-felt**: Fjernet separat postnummer-felt — postnummer udtrækkes automatisk fra adresse
- **Nærhedslabel**: "Region" omdøbt til "Alternativ" med amber-farve i medarbejdervælgeren
- **Medarbejder-formular**: Fjernet adresse-felt, kun postnummer vises nu (Admin-only)
- **Redigering af opgave**: Nærhedssortering virker nu korrekt ved redigering (postnummer udtrækkes fra eksisterende adresse)

### Fixed - 2026-02-16
- **DAWA Proxy**: Adresse-autocomplete rutes nu via Supabase Edge Function (`dawa-proxy`) for at undgå CORS-blokering på alle domæner (preview, live, localhost)

- **RLS-fix**: `secure_profile_updates`-policyen tillader nu `super_admin`-rollen at opdatere medarbejderprofiler (postnummer, adresse m.m. blev ikke gemt)

### Added - 2026-02-16
- **DAWA Adresse-Autocomplete**: Smart adresse-søgning i Planner-formularen via Danmarks Adressers Web API
  - Autocomplete-dropdown med forslag når brugeren taster en adresse
  - Ved valg udfyldes adresse, postnummer og by automatisk
  - Postnummer synkroniseres med nærhedsbaseret medarbejder-sortering
  - Fallback til manuel fritekst-indtastning ved API-fejl
  - Nye database-kolonner: `zip_code` og `city` på `assignments`-tabellen
  - Dokumenteret under "External APIs" i `docs/technical-specs/architecture.md`
- Wrappet resterende uguardede `console.error`/`console.warn` i `import.meta.env.DEV` guard (client.ts, SecurityHeaders.tsx, useAssignmentFiles.ts)
- Slettet `definer_no_search_path` og `console_prod_logging` findings fra sikkerhedspanelet (allerede rettet)
- Markeret `demo_pass_in_migrations` og `chart_dangerous_html` som ignoreret med begrundelse
- Sikkerhedspanelet har nu 0 errors, 0 warnings, 2 ignorerede infos

<!-- 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  CRITICAL: MANDATORY CHANGELOG UPDATES ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THIS FILE MUST BE UPDATED WITH EVERY CODE CHANGE!

📝 When to Update:
   ✅ New features or components
   ✅ Bug fixes and issue resolutions
   ✅ Performance improvements
   ✅ Database schema changes
   ✅ Security updates
   ✅ Breaking changes

📋 Format:
   ## [Unreleased]
   
   ### Fixed - YYYY-MM-DD
   - Bug fix descriptions
   
   ### Added - YYYY-MM-DD
   - New feature descriptions
   
   ### Changed - YYYY-MM-DD
   - Modification descriptions

📖 See CONTRIBUTING.md for detailed guidelines

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Medarbejder-adresse og planner-layout (Fase 5, Del 3) - 2026-02-16
- Tilføjet `home_address` kolonne til `profiles`-tabellen (fritekst)
- Postnummer og adresse vises nu på samme linje i medarbejder-formularen (grid: 100px + 1fr)
- Postnummer og adresse vises sammen i medarbejdertabel og mobilkort
- Fix: `home_postcode` manglede i demo-data transform — nu inkluderet
- Planner: Postnummer-felt flyttet op på samme linje som adresse (grid: 120px + 1fr)
- DA/EN oversættelser tilføjet for `homeAddress` og `homeAddressPlaceholder`

### Nærhedsbaseret Booking-forslag (Fase 5, Del 2) - 2026-02-16
- Tilføjet "Sagens postnummer"-felt i opgaveformularen (kun numerisk, max 4 cifre)
- Medarbejderlisten sorteres automatisk efter nærhed når postnummer indtastes
- 3 proximity-niveauer: Direkte match (grøn badge + MapPin), Regional match (lysgrøn badge), Øvrige
- Tomt felt = normal alfabetisk sortering
- Frontend-only logik via `useMemo` — ingen database-ændringer
- DA/EN oversættelser tilføjet

### Geografisk Grundlag (Fase 5, Del 1) - 2026-02-16
- Tilføjet `home_postcode` kolonne til `profiles`-tabellen med CHECK constraint for dansk 4-cifret postnummerformat
- Postnummer-felt i medarbejder-formularen (opret/rediger) — kun synligt for admin-brugere
- Postnummer-kolonne i medarbejdertabel og mobilkort — kun synligt for admin-brugere
- Klient-side validering: kun cifre, max 4 tegn, inputMode="numeric"
- DA/EN oversættelser tilføjet

### Sikkerhedsoprydning (Fase 10) - 2026-02-16
- **SECURITY**: Tilføjet `SET search_path = public` til 4 SECURITY DEFINER funktioner: `can_user_access_assignment`, `can_access_assignment`, `is_admin_user`, `get_current_user_role`
- **SECURITY**: Tilføjet CHECK constraints: `assignment_messages` max 5000 tegn, `assignment_files` kommentarer max 2000 tegn
- **SECURITY**: Strammet storage bucket policy for `assignment-files` — kun adgang for tildelte medarbejdere, ansvarlige og admins
- **SECURITY**: Tilføjet `CRON_SECRET` validering til 3 edge functions: `cleanup-expired-users`, `cleanup-change-logs`, `send-duty-reminders`
- **SECURITY**: Klient-side længdevalidering tilføjet i `useAssignmentMessages` (max 5000 tegn) og `useAssignmentFiles` (max 2000 tegn)
- **LOGGING**: Wrappet 80+ uguardede `console.log/warn/error` i `import.meta.env.DEV` guard i 14 filer: weekFormatting, UserManagement, demoUserService, secureProfileService, securityManager, carSecurityService, useDutyActions, useAssignmentMessages, useAssignmentFiles, PasswordChangeDialog, LocationManagement, UserFormDialog, AuthContext, NotificationContext

### Fixed - 2026-02-16
- **KRITISK FIX**: 10 opgaver med `department_id = NULL` (inkl. 12-013546 "Håndværkervej 23") var usynlige i planner — backfilled til afd. 12 - Fredericia
- **KRITISK FIX**: Vagter (kørevagt/skadeledervagt) blev gemt uden `department_id` og var usynlige — `useDutyActions.ts` tilføjer nu `department_id`/`sub_department_id` ved oprettelse
- **RPC-FIX**: `list_accessible_assignments_with_team` inkluderer nu opgaver med `NULL department_id` (defensiv `OR a.department_id IS NULL`)
- **QUERY-FIX**: `useDutyData.ts` bruger nu `.or()` filter der inkluderer vagter med `NULL department_id`
- 21 orphaned vagter backfilled med korrekt `department_id` baseret på opretterens afdeling
- **AUTH FIX**: Synkroniseret `auth.users.email` med `profiles.email` for Petrie Rasmussen (vikar opgraderet til fast bruger havde stadig `@temp.local` email i auth)

### Demo-RPC migrering + Afdelingsvælger redesign (Fase 9e) - 2026-02-15
- **KRITISK FIX**: Alle 6 demo-RPCs migreret fra `demo.*` schema til `public.*` schema med `WHERE is_demo = true`
  - `get_demo_cars_with_security`, `get_demo_profiles_admin_detailed`, `get_demo_warehouse_items`
  - `get_demo_duties_with_employee`, `get_demo_vacations`, `list_demo_assignments_with_team`
  - Løser: Biler/medarbejdere/lager oprettet i demo-mode blev ikke vist (skrevet til public, læst fra demo)
  - Løser: Fejl ved klik på Medarbejdere under afd. 02 (demo.profiles/demo.user_roles manglende data)
- Realtime-subscription i `useDutyData` bruger nu altid `schema: 'public'` (fjernet `demo`-routing)
- Afdelingsvælger redesignet til side-by-side layout: `[Afd. 02 ▾] / [Fugt & Skimmel ▾]`
  - Hovedafdeling og underafdeling som separate dropdowns
  - Layers-ikon for underafdelinger, Building2-ikon for hovedafdelinger
- DEV-guard på 12 console.log i `useDutyData`, `carSecurityService`, `useCarFormState`, `DepartmentContext`

- **KRITISK FIX**: `demoSchemaClient.from()` bruger nu ALTID `public`-schema — `demo`-schema routing fjernet komplet
- Migreret `useEmployeeActions` (toggleLeave/update/delete) fra DemoUserService til Supabase DB med `is_demo` flag
- Migreret `useAssignmentActions` (create/update/publish/publishByDate) — fjernet alle DemoUserService-kald og sessionStorage
- Fjernet local-merge af sessionStorage i `useAssignmentDataOptimized` og `useEmployeeData` — RLS leverer nu demo-data direkte
- Realtime subscriptions lytter nu KUN på `public` schema (ikke `demo`) i alle hooks
- Forenklet `useDemoTracking` til at bruge `reset_demo_data` og `cleanup_demo_data_ttl` RPC
- DEV-guard på ~30 uguardede `console.log` i useAssignmentActions, useCarActions og useAssignmentDataOptimized
- Live-data beskyttelse: RESTRICTIVE RLS + `.eq('is_demo', false)` + pg_cron TTL cleanup

### Demo DB-skrivninger migrering (Fase 9d fortsat) - 2026-02-15
- Migreret demo assignments CRUD fra sessionStorage (DemoUserService) til database med `is_demo: true`
- Migreret demo bil-sletning og tilgængelighed fra lokalt til Supabase `.delete()`/`.update()`
- Fjernet `DemoUserService.getDemoCars()` local-merge i useCarData — RLS leverer demo-data
- Migreret warehouse demo CRUD (create/update/delete) til database med `is_demo: true`
- Fjernet alle DemoUserService-imports fra optimizedAssignmentService, useCarActions, useCarData
- Fjernet `convertStoredDemoToOptimized` afhængighed for nye assignments (nu via enrichAssignmentData)

### Demo-data isolering via is_demo flag (Fase 9d) - 2026-02-15
- Tilføjet `is_demo` boolean-kolonne (default false) til 8 primære tabeller: assignments, cars, profiles, warehouse_items, vacations, on_call_duties, notifications, assignments_employees
- Partial indexes på `is_demo WHERE is_demo = true` for hurtig filtrering
- RESTRICTIVE RLS-politikker: live-brugere ser ALDRIG demo-data (is_demo=true kun synligt for demo-bruger ID)
- RPC `reset_demo_data()`: sletter alle is_demo=true rækker på tværs af tabeller (til "Ryd Demo Data"-knap)
- RPC `cleanup_demo_data_ttl()`: automatisk TTL-oprydning af is_demo=true ældre end 15 minutter
- Frontend: alle create-hooks tilføjer `is_demo: true` i demo-mode (assignments, cars, profiles, vacations, duties)
- Frontend: alle live-mode SELECT-queries tilføjer `.eq('is_demo', false)` som defense-in-depth
- `useDemoAutoCleanup` bruger nu `reset_demo_data()` RPC i stedet for sessionStorage cleanup
- Services opdateret: enhancedDataFetching, unifiedDataService med is_demo filtrering

### Demo-data afdelingsisolering (Fase 9c) - 2026-02-15
- Tilføjet klient-side afdelingsfiltrering for demo-mode: al demo-data tilhører dept 12 - Fredericia
- Skift til dept 02 - Storkøbenhavn returnerer nu tomme lister for medarbejdere, biler, lager, ferier, vagter og opgaver
- Ny `src/constants/demo.ts` med `DEMO_HOME_DEPARTMENT_ID` og `isDemoNonHomeDepartment()` hjælpefunktion
- Berørte hooks: `useEmployeeData`, `useCarData`, `useWarehouseData`, `useVacationData`, `useDutyData`, `useUnifiedData`
- Berørt service: `optimizedAssignmentService` (fetchAllAssignments, fetchAllPublishedAssignments)
- Ingen database-ændringer — kun klient-side filtrering

### Demo-bruger afdelingsadgang (Fase 9b) - 2026-02-15
- Demo-bruger (`test@polygongroup.com`) får nu adgang til **02 - Storkøbenhavn** med alle 3 underafdelinger (Fugt & Skimmel, Løsøre, Miljø & Brand)
- Eksisterende data (1.023 opgaver, 12 biler, 22 lageremner) forbliver isoleret på **12 - Fredericia** og vises kun når dept 12 er valgt
- Ingen kodeændringer — kun 3 nye rækker i `user_access`-tabellen

### End-to-End QA & Production Readiness (Fase 9) - 2026-02-15
- Erstattet ~80 hardcoded Tailwind gray-klasser med semantiske tema-tokens i 10 filer: NotFound, PasswordResetPage, Index, CarsPage, EmployeesPage, MobileNavigation, EmployeeLoadingError, CarMarkAvailableDialog, spinner, EmployeeFormDialog
- Oversat 6 engelske strenge til dansk i `Index.tsx` (sessionsfejl-dialog) og "Technical details" → "Tekniske detaljer" i `EmployeeLoadingError.tsx`
- DEV-guard på ~23 uguardede `console.log` i 5 filer: EmployeeAvailabilityDialog, useEmployeeDialogData, VacationFormDialog, assignmentDataConverter, PasswordResetPage
- Spinner-komponent bruger nu `border-muted-foreground/30 border-t-primary` (dark mode-kompatibelt)
- Projekt markeret som **Production Ready** i `docs/implementation-plan/tasks.md`

### UI/UX Finpudsning & Responsivitet (Fase 8) - 2026-02-15
- Erstattet hardcoded `text-gray-*` / `bg-gray-*` / `border-gray-*` / `hover:bg-gray-*` med semantiske tema-tokens i 6 komponenter: PlannerPage, CarSelector, UserManagement, LoadingSpinner, TopNavbar, EnhancedVacationCard
- TopNavbar bruger nu `bg-background/95`, `border-border`, `text-foreground` og `hover:bg-muted` (dark mode-kompatibelt)
- Tilføjet `overflow-x-auto` på CarsTable og WarehouseTable for mobil horisontal scroll
- DEV-guard på 4 console.log i AssignmentDetails.tsx (forhindrer medarbejder-data logging i produktion)
- Opdateret `docs/ui-guidelines/component-library.md` med gitter-visnings-regler og tabel-scroll-guidelines

### Performance: TanStack Query Caching & Realtime-konsolidering (Fase 7) - 2026-02-15
- `useOptimizedAssignments` migreret fra `useState`/`useEffect` til TanStack Query `useQuery` med `staleTime: 5min` og `gcTime: 10min` — tab-skift viser nu cached data øjeblikkeligt
- Realtime-kanal bruger `queryClient.invalidateQueries` i stedet for fuld refetch (reducerer unødige netværkskald)
- Tilføjet `assignments_employees`-lytning i realtime-kanalen (fanger medarbejder-tildelinger i realtid)
- Fjernet duplikeret `assignments`-lytter fra `useUnifiedData.ts` (allerede dækket af useOptimizedAssignments)
- DEV-guard på 50+ console.log i `optimizedAssignmentService.ts`, `realtimeManager.ts` og `usePlannerPage.ts`
- Optimistisk UI bevaret via `localAssignments` state-override der automatisk nulstilles ved server-svar

### Database Optimization (Fase 6) - 2026-02-15
- Fjernet 14 redundante indexes på tværs af `notifications`, `profiles`, `assignments`, `logs`, `case_folder_mappings` og `vacations` (reducerer write-overhead)
- Fjernet ineffektivt `logs_message_idx` (btree på TEXT-kolonne med kun 95 distinct værdier)
- Slettet 317.538 støj-rækker fra `logs`-tabellen: `vacation_realtime_change` (229k), `enhanced_error_timeout` (58k), `enhanced_error_database` (30k) — estimeret ~180 MB frigjort (65% reduktion)
- Dokumenteret 5 redundante kolonner (assignments: onedrive_folder_id, route_distance_km, route_duration_min, attachment_files; cars: sub_department_id) — fjernes ikke pga. sikkerhedsklausul
- Verificeret `assignment_files`-tabel som korrekt normaliseret fil-metadata storage

### Security (Fase 5) - 2026-02-15
- Verificeret `can_access_vacation()` RLS-funktion — skadeledere korrekt begrænset til egen afdeling
- Fjernet følsom logging fra `admin-reset-password` edge function: klient-IP, token-længde, service key presence, bruger-email, password-længde
- Tilføjet JWT-validerings-dokumentation som kommentarer i `admin-reset-password` edge function
- Fjernet bruger-email fra security event logs i `admin-reset-password` (bruger nu kun user_id)
- Wrapped 48+ console.log i `import.meta.env.DEV` guard på tværs af 14 filer for at forhindre brugerdata-eksponering i produktion
- Berørte filer: EnhancedSecureLoginForm, notificationRealtime/Actions/Fetching, useVacationRequestActions, useVacationSecurity, useAssignmentFormState, useAssignmentActions, useEmployeeCreation, Index, PasswordResetPage, ScreenDisplayPage, databaseCleanup

### Added - 2026-02-15
- Erstattet 36 hardcoded gray-farver med semantiske tema-tokens i `CarsTable.tsx` og `MobileCarCard.tsx` (border-border, text-foreground, text-muted-foreground, bg-muted)
- Oprettet `docs/implementation-plan/timeline.md` med milepæle: Prøveperiode uge 10, Udrulning uge 12, fremtidige afdelinger
- Oprettet `docs/product-roadmap/features.md` med nuværende (7) og kommende (5) features
- Oprettet `docs/product-roadmap/user-personas.md` med 5 roller: Super Admin, Administrator, Skadeleder, Servicemedarbejder, Vikar
- Oprettet `docs/technical-specs/database-schema.md` med afdelingsrelationer, junction-tabeller, indexes og backup-rutiner
- Oprettet `docs/ui-guidelines/design-system.md` med regler for Standard, Kompakt og Gitter-visning, farve-tokens og spacing
- Oprettet `docs/technical-specs/data-models.md` med komplet oversigt over 17+ tabeller, relationer, enums og 47 RPC-funktioner
- Oprettet `docs/technical-specs/architecture.md` med SHA256/bcrypt-kryptering, RLS-politikker, edge function sikkerhed og input-sanitering
- Oprettet `docs/ui-guidelines/component-library.md` med 9 shared-komponenter og 51 UI-primitiver inkl. props og anvendelsesmønstre
- Oprettet `docs/` mappestruktur som projektets Single Source of Truth
- `docs/implementation-plan/` med `readme.md` og `tasks.md` (4 faser: Sikkerhed, Database, Performance, UI)
- `docs/product-roadmap/readme.md` — langsigtet vision og multi-afdeling udrulning
- `docs/technical-specs/readme.md` — database-arkitektur, RLS, sikkerhedsstandarder
- `docs/ui-guidelines/readme.md` — visuelle standarder, visninger, responsivitet

### Visuel polish - 2026-02-15
- AssignmentCard: Tilføjet `hover:shadow-xl transition-all duration-200` for blød skygge-effekt ved hover
- DaySection: Erstattet `hover:bg-gray-50` med `hover:bg-muted/50` (dark mode-korrekt) og `text-gray-500` med `text-muted-foreground` på chevron-ikoner
- DaySection: Forbedret tom-tilstand med CalendarX2-ikon, `rounded-xl`, `bg-muted/20` baggrund og `py-8` spacing
- PageHeader: Opgraderet typografi til `font-bold tracking-tight`, beskrivelse med `leading-relaxed`, kort med `rounded-2xl` og `shadow-md`

### Visuel konsistens-gennemgang - 2026-02-15
- Wrappet 50+ uguardede console.log kald i `import.meta.env.DEV` guard i 5 Planner-komponenter (AssignmentCard, DaySection, EmployeeSelector, ResponsibleUserSelector, AssignmentFormFields)
- Erstattet hardcoded `text-gray-*` farver med tema-variabler (`text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted`) i PageHeader, shared/EmptyState, CompactAssignmentRow, EmployeesList, AssignmentCard, DaySection
- Standardiseret tomme tilstande til ensartet `py-12` spacing og tema-farver
- Slettet ubrugt `Planner/EmptyState.tsx` (AssignmentList bruger nu `shared/EmptyState`)
- Fjernet debug-kode og verbose logging fra ResponsibleUserSelector og AssignmentFormFields

### Funktionel logik-gennemgang - 2026-02-15
- Rettet: `super_admin` kan nu slette andres chat-beskeder (manglede i rolle-listen i `AssignmentMessagesPanel`)
- Tilføjet: 20MB filstørrelses-validering på assignment fil-upload (forhindrer vilkårligt store uploads)
- Wrappet 4 resterende console.log kald i `import.meta.env.DEV` guard (`PlannerContent`, `TopNavbar`)

### Performance Optimization - 2026-02-15
- Wrapped 100+ debug `console.log` kald i `import.meta.env.DEV` guard på tværs af 9 filer (eliminerer console I/O i produktion)
- Fjernet verbose per-assignment logging i `employeeAvailability.ts` (tusindvis af logs per dashboard-render)
- Fjernet `logSecurityEvent('vacation_realtime_change')` fra realtime-handler i `useVacationData.ts` (stoppede 170MB+ logs-bloat i databasen)
- Profilmenu viser nu brugerens jobtitel (f.eks. "Skadeleder/Projektleder") i stedet for teknisk rolle-ID ("super_admin")
- Fjernet ubrugte imports (`Settings`, `useEffect` fra `useDashboard.ts`, `useToast`/`useTranslation`/`usePermissions` fra `useAssignmentsConsolidated.ts`)

### Database Optimization - 2026-02-15
- Tilføjet 8 manglende indexes på `department_id` og `sub_department_id` for `assignments`, `on_call_duties`, `vacations` og `warehouse_items` tabeller (forbedrer filtrerings-performance)
- Fjernet 3 redundante indexes på `assignments` (`idx_assignments_date_published`, `idx_assignments_responsible_user`, `idx_assignments_responsible_published`) — dækket af eksisterende composite indexes
- Dynamisk undertitel på login-side: Viser nu sidst valgte afdeling (fra localStorage) i stedet for hardcoded "Afdeling 12 - Trekantsområdet"
- Fjernet hardcoded "Afdeling 12 Trekantsområdet" fra `index.html` meta description og Open Graph tags
- Opdateret fallback-tekst i oversættelser: DA → "Internt planlægningssystem", EN → "Internal planning system"
- Dokumenteret `cars.sub_department_id` som redundant kolonne (erstattet af `car_sub_departments` junction-tabel, fjernes ikke nu)
- Dokumenteret logs-tabel som 276 MB / 366k rækker med 63% `vacation_realtime_change` støj (anbefaling: oprydning af logs ældre end 30 dage)
- Fil-upload metadata (`assignment_files`) verificeret som effektiv — ingen redundans

### Security Audit - 2026-02-15
- Fjernet JWT token-preview logging fra Admin PasswordChangeDialog (konsol-sikkerhed)
- Fjernet hardcoded API-nøgle fra Admin PasswordChangeDialog — bruger nu `supabase.functions.invoke`
- Fjernet password-metadata logging (password-længde) fra konsollen
- Fjernet service-key prefix logging fra `admin-list-users` edge function
- Wrapped 50+ debug console.log kald i AuthContext med `import.meta.env.DEV` guard (KASPER SESSION FIX / BRIAN REUS DEBUG logs)
- Wrapped e-mail og token logs i PasswordResetPage med `import.meta.env.DEV` guard
- Gennemført fuld RLS-audit af alle 24 tabeller — ingen kritiske policy-fejl fundet
- Gennemført auth-audit af alle 11 edge functions — korrekt JWT-verifikation og rolle-check
- Dokumenteret kendte advarsler: `profiles` og `user_roles` er offentligt læsbare (nødvendigt for app-funktionalitet)

### Added - 2026-02-14
- Biler kan nu tilknyttes flere underafdelinger via junction-tabel (`car_sub_departments`)
- Validering: Mindst én underafdeling skal vælges ved oprettelse/redigering af bil
- Tom-tilstand (empty state) på bilsiden når ingen biler er tilknyttet underafdelingen
- Pull-to-refresh på bilsiden

### Fixed - 2026-02-14
- Sags-dialog på mobil: Beskrivelse kan nu scrolles (overflow-hidden rettet til overflow-y-auto)
- Brændstofkortkode viste "PENDING_ADMIN_APPROVAL" — værdi ryddet og `can_view_fuel_codes()` opdateret til at inkludere super_admin
- Ferie-medarbejderliste: Super Admin og andre brugere kan nu vælges i "Ansøg for medarbejder" dialogen
- Ferie-medarbejderliste filtreres nu korrekt efter aktiv underafdeling
- Biler forsvandt fra listen efter oprettelse når ingen underafdeling var valgt
- Fjernet gammel `sub_department_id` kolonne-reference fra bil-opdatering (bruger nu udelukkende junction-tabel)

### Security - 2026-02-14
- `can_view_fuel_codes()` RPC opdateret til at inkludere `super_admin` rollen
- Demo-isolering af `user_access` og `car_sub_departments` queries (bruger nu `getSchemaClient` i demo-mode)
- `car_sub_departments` sync springes over i demo-mode for at undgå påvirkning af live-data
- Demo-bilvisning filtrerer nu korrekt gamle produktionsdata fra `demo.cars` (kun biler oprettet efter baseline-dato vises)

### Changed - 2026-02-14
- Planner gitter-visning bruger nu 3 kolonner på desktop (md:grid-cols-3) i stedet for 2
- Opgavebeskrivelser i planner-kort begrænset til maks 3 linjer via `line-clamp-3` (erstatter punktopstilling)

### Security - 2026-02-14
- RLS-policies på vacations-tabellen strammet: Skadeledere kan nu kun se/redigere ferieanmodninger for brugere i deres egne afdelinger (via ny `can_access_vacation` SECURITY DEFINER-funktion). Admins og super_admins beholder fuld adgang.
- Fjernet følsom console-logging fra PasswordChangeDialog (token-previews, password-længder, auth-metadata)
- Dokumenteret `verify_jwt = false` i config.toml for admin-reset-password edge function

### Removed - 2026-02-14
- 49 ubrugte filer slettet (komponenter, hooks, services, utils) efter komplet projektaudit
- Inkluderer bl.a. SystemHealthDashboard, SecurityAuditPanel, PerformanceMonitoringPanel, SecureLoginForm og tilhørende hooks/services

### Fixed - 2026-02-14
- Tilføjet manglende oversættelsesnøgler: `common.retrying`, `employees.generalErrorTitle`, `employees.generalErrorDescription`, `employees.selected` (EN), `employees.employees` (EN)

### Added - 2026-02-12
- LICENSE fil oprettet med MIT-licens (Copyright © 2026 Kasper Schmidt Johansen)
- README.md mappestruktur opdateret til at matche den reelle projektstruktur (begge sprog)
- README.md licens-sektioner opdateret fra "privat licens" til MIT med link til LICENSE-filen
- Global ErrorBoundary med brugervenlig fejlside (dansk/engelsk) - forhindrer hvid skærm ved uhåndterede fejl
- Page-level DataFetchErrorBoundary på alle 9 hovedsider (Dashboard, Planner, Employees, Cars, Vacation, Duty, Warehouse, ChangeLog, Admin)
- Global MutationCache error handler i QueryClient til automatisk fejlhåndtering af mutations
- Optimistic UI opdateringer for bil-handlinger (toggle tilgængelighed, sletning) med automatisk rollback
- Optimistic UI opdateringer for lager-handlinger (opret, opdater, slet) med automatisk rollback
- TanStack Query (React Query) caching på alle 5 hoved-data-hooks (biler, medarbejdere, vagter, lager, ferie)
- Cache invalidation via `queryClient.invalidateQueries` i 9 action/mutation hooks

### Changed - 2026-02-12
- Data-fetching konverteret fra manuelt useState/useEffect til useQuery med 5 minutters staleTime
- Realtime-subscriptions kalder nu invalidateQueries i stedet for manuelle fetch-funktioner
- Optimistic UI bruger queryClient.setQueryData som kompatibilitetslag

### Fixed - 2026-02-12
- Generisk ErrorBoundary default fallback fikseret - viste før children igen (uendelig loop-risiko)
- Servicemedarbejdere kan nu se alle medarbejdere i deres afdeling (ikke kun sig selv)
- RLS-policy på user_access opdateret til at tillade afdelingsbaseret visning

### Changed - 2026-02-12
- Login kræver ikke længere valg af afdeling — automatisk tildeling efter login
- Super Admin kan nu skifte afdeling i demo mode via header-selector
- DepartmentContext bruger nu effectiveRole i stedet for user.role til demo-rolleskift

### Security - 2026-02-12
- Fjernet hardkodet demo-adgangskode fra kildekoden (nu via environment variabel)
- Hærdnet RLS-policies: on_call_duties UPDATE, assignment_messages/files SELECT, departments/sub_departments SELECT

### Fixed - 2025-02-12
- Lager-redigering i demo mode gemmes nu korrekt i hukommelsen
- Rolle-skift toast bruger nu korrekte oversættelsesnøgler
- Super Admin ser nu samme dashboard-metrics og Quick Access som Administrator
- Super Admin kan nu redigere lagervarer og vælges som ansvarlig i planlæggeren

### Added - 2025-02-12
- Lokationsstyring med inline-redigering og sletning i Admin-panelet
- Admin locations oversættelser (da/en)

### Performance - 2025-02-12
- Reduceret Google Fonts vægt (300-700 i stedet for 300-900)
- Fjernet render-blocking font preload
- Tilføjet inline kritisk CSS for loading spinner
- Dynamic import af performanceMonitor (kun i development)
- Fjernet ubrugt App.css indhold
- Tilføjet cache-headers for statiske assets

### Added - 2025-01-09
- **Demo Mode Write Access**: Demo mode now supports full CRUD operations
  - Users can create, update, and delete assignments, cars, employees, and vacations in demo mode
  - All demo operations are automatically tracked and cleaned up every 15 minutes
  - Manual cleanup button available for immediate data reset
  - Baseline data is preserved while session-created records are removed
  - Affects: `src/hooks/car/useCarData.ts`, `src/components/Admin/UserManagement.tsx`, `src/services/optimizedAssignmentService.ts`

- **Loading Translation**: Added Danish translation for loading screens
  - New `loadingApplication` translation key added to both Danish and English
  - Browser language detection implemented for pre-initialization loading screens
  - Affects: `src/translations/da/common.ts`, `src/translations/en/common.ts`, `src/App.tsx`, `src/components/Layout/MainLayout.tsx`

- **Documentation**: Created comprehensive CONTRIBUTING.md
  - Guidelines for changelog updates (mandatory for all code changes)
  - Development workflow documentation
  - Code style guidelines and best practices
  - Testing checklist and deployment notes

### Fixed - 2025-01-09
- **Loading Screen Language**: Fixed hard-coded English "Loading application..." appearing in Danish interface
  - Loading screens now detect browser language (Danish/English) before translation system initializes
  - Consistent language experience from initial page load
  - Affects: `src/App.tsx`, `src/components/Layout/MainLayout.tsx`

### Changed - 2025-01-09
- **Demo Mode Behavior**: Removed read-only restrictions from demo mode
  - Demo users can now fully interact with the system
  - Data integrity maintained through automatic 15-minute cleanup cycles
  - Session-end cleanup ensures no demo data persists after logout
- **Changelog Header**: Enhanced with clear mandatory update instructions
  - Visual indicators for critical requirements
  - Quick reference format guide
  - Link to detailed contributing guidelines

### Fixed - 2025-01-24
- **Demo Data Persistence**: Fixed demo data disappearing on page navigation
  - Employees and assignments now persist in sessionStorage across page changes
  - Added full virtualization for employee CRUD operations (create, update, delete)
  - Added virtualization for assignment delete operations
  - Demo data now properly merges with baseline data on fetch
  - Data persists until manual deletion, "Clear demo data" button, or 15-minute auto-cleanup
  - Affects: `src/services/demoUserService.ts`, `src/hooks/employee/useEmployeeData.ts`, `src/hooks/employee/useEmployeeActions.ts`, `src/services/optimizedAssignmentService.ts`, `src/hooks/assignment/useAssignmentActions.ts`
- **Demo Mode Auto-Refresh**: Removed unnecessary polling that caused page stuttering
  - Removed 40-second polling interval from car data fetching in demo mode
  - Demo data now only fetches once on mount and updates via explicit CRUD operations
  - Significantly improves demo mode performance and prevents unwanted page refreshes
  - Affects: `src/hooks/car/useCarData.ts`
- **Employee Absence Toggle**: Fixed UI not refreshing immediately when toggling employee absence status
  - Implemented deep change detection in `useEmployeeData` to properly detect onLeave and status changes
  - Updated component key prop to include absence status and employee status for proper re-rendering
  - Added missing translation keys for absence toggle toast messages (Danish and English)
  - Toast messages now display properly translated text instead of translation keys
  - Affects: `src/hooks/employee/useEmployeeData.ts`, `src/pages/EmployeesPage.tsx`, `src/components/Employees/EmployeesTable.tsx`, `src/translations/da/employees.ts`, `src/translations/en/employees.ts`
- **Demo User Visibility**: Hidden demo user profile from production employee list
  - Demo user (`test@polygongroup.com`) is now filtered out in production views
  - Demo mode users still see all employees including demo user
  - Prevents confusion by keeping demo-only accounts hidden from regular users
  - Affects: `src/hooks/employee/useEmployeeData.ts`
- **Vikar Selection Error Fixed**: Improved error handling in employee selector for vikarer
  - Added comprehensive error handling and validation for employee data
  - Vikarer with missing fields no longer crash the selector
  - Added detailed error logging for debugging
  - Affects: `src/components/Planner/EmployeeSelector.tsx`
- **Expiration Date Validation**: Enhanced vikar creation with expiration date validation
  - Prevents setting expiration dates in the past
  - Warns when expiration is more than 6 months away
  - Improved user experience with clear error messages
  - Affects: `src/components/Employees/EmployeeFormDialog.tsx`
- **Cleanup Function Enhanced**: Improved temporary user cleanup function
  - Updated Petrie's expiration date for testing
  - Added detailed logging for cleanup operations
  - Now returns deletion count and affected user IDs
  - Improved error handling for auth user deletion
  - Fixed security warning (search_path set to empty string)
  - Affects: Database function `cleanup_expired_temporary_users()`

### Fixed - 2025-01-23
- **Demo Mode Data Filtering**: Cars and employees now filtered by creation date (>= 2025-10-23) to exclude baseline production data
  - Only shows recent demo cars (CAR-001, CAR-002, VAN-001) on Cars page
  - Dashboard metrics now correctly count only recent demo employees and cars
  - Affects: `src/hooks/car/useCarData.ts`, `src/services/enhancedDataFetching.ts`
  
- **Vacation Request Red Dot**: Fixed pending vacation indicator not appearing in demo mode
  - Made `useVacationRequestsStatus` schema-aware to query demo.vacations in demo mode
  - Red dot now appears on "Fridage" nav item when pending requests exist
  - Affects: `src/hooks/vacation/useVacationRequestsStatus.ts`

- **Admin Panel Navigation**: User Management ("Brugerstyring") now opens first when accessing admin section
  - Changed default tab from "overview" to "users"
  - Affects: `src/pages/AdminPage.tsx`

### Added
- Created comprehensive changelog system for tracking project changes
- Enhanced demo user role switching with proper persistence
- Real-time task creation for demo users without page reload requirement
- Complete Danish translations for demo dashboard auto-cleanup timer
- Auto-cleanup timer functionality with 15-minute extension capability
- Warning system for imminent demo data deletion
- GitHub integration documentation
- New `useVacationRequestsStatus` hook to track pending vacation requests directly from database

### Fixed
- **Toast notification system standardized** to single import location (`@/hooks/use-toast`)
- **Login now loads data immediately** without requiring page refresh
- **Vacation request notifications now persist** until requests are approved/rejected (red dot indicator)
- **Dashboard metrics** now show "no data" message instead of error when no assignments exist
- **Cars page in demo mode** now correctly filters to show only demo vehicles
- **Dashboard metrics calculations** enhanced to handle both demo and production data formats
- **Employee role enrichment** now properly fetches actual roles from `user_roles` table instead of hardcoding all employees as 'servicemedarbejder'
- **Available cars metric** now correctly excludes cars with `show_in_planner = false`
- **Available employees metric** now correctly counts only servicemedarbejder role employees
- Demo role switching now properly persists user selection without database override
- Task creation for demo users now shows immediately without manual page refresh
- Translation provider initialization race condition resolved
- Enhanced error handling for authentication state changes
- Improved real-time subscription handling for demo user isolation

### Changed
- Demo role initialization logic to prevent constant resets to database role
- Assignment data fetching to provide immediate updates for demo users
- Translation system loading to prevent useTranslation errors during initialization
- Enhanced logging for demo mode operations and role switching
- Vacation notification logic changed from notification-based to database query-based for persistence

### Technical Improvements
- **Auth stabilization delay increased** from 100ms to 200ms for better data loading synchronization
- **Data fetching** now includes 50ms delay before first fetch to ensure auth state is ready
- Optimized auth context initialization with better session handling
- Improved demo user filtering with immediate data visibility
- Enhanced translation context with proper initialization checks
- Better error recovery for authentication and user data fetching
- Removed 46 duplicate toast import references across the codebase
- Employee data fetching now joins with `user_roles` table to get actual user roles
- Dashboard metrics filtering improved for accurate employee and car counts

---

## Version History

### [1.0.0] - 2025-01-14
- Initial release of the Weekly Planner application
- Core functionality for task management, employee scheduling, and resource allocation
- Multi-language support (Danish/English)
- Role-based access control (Administrator, Skadeleder, Servicemedarbejder)
- Demo mode with automatic data cleanup
- Supabase integration for backend services
- Real-time updates for collaborative planning

---

## Maintenance Notes

This changelog is maintained to track all significant changes to the codebase.

**For Contributors:**
- Add entries under `[Unreleased]` section when making changes
- Use standard categories: Added, Changed, Deprecated, Removed, Fixed, Security, Technical Improvements
- Move unreleased changes to a new version section on release
- Follow semantic versioning for version numbers
- Keep descriptions concise but informative
- Include user-facing impact when relevant

**Changelog Update Process:**
1. Before committing significant changes, update the `[Unreleased]` section
2. Group related changes together under appropriate categories
3. Write clear, descriptive entries that explain what changed and why
4. On version release, move `[Unreleased]` items to a new version section with date
5. Create a new empty `[Unreleased]` section for future changes

For detailed commit history, see the Git repository.