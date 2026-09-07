# Sygemelding af medarbejdere

Administratorer kan markere en medarbejder som syg for dagen. Sygdom er kun synlig for administratorer og skadeledere — alle andre ser blot personen som "Fraværende".

## Hvad du får

- En "Syg i dag"-knap på hver medarbejder på medarbejdersiden (kun synlig for administratorer).
- Markeringen gælder kun den pågældende dag. Ved dagsskifte er alle igen normale, så man skal ind hver dag og markere de syge.
- Den syge fjernes automatisk fra dagens opgaver, præcis som ved godkendt fravær og kursus.
- Administratorer og skadeledere ser et rødt "Syg"-mærke. Servicemedarbejdere og vikarer ser kun "Fraværende" uden årsag — og kan ikke få fat i årsagen nogen steder.
- Den syge kan ikke vælges til opgaver den dag og tæller med i "Fraværende" på dashboard og i ikke-tildelte ressourcer.

## Teknisk

**Database (migration)**
- Ny tabel `public.sick_days`: `user_id`, `department_id`, `sick_date`, `created_by`, tidsstempler, unik på (user_id, sick_date).
- GRANT: `select, insert, delete` til `authenticated`, `all` til `service_role`. Ingen anon.
- RLS: kun `administrator`/`super_admin` i samme afdeling må oprette/slette; læsning direkte i tabellen begrænses til `administrator`, `super_admin` og `skadeleder` i afdelingen. Ingen andre roller kan læse rækkerne.
- Ny SECURITY DEFINER-funktion `list_department_absent_user_ids(_department_id uuid, _date date)` med `SET search_path = ''`, som returnerer kun bruger-id'er (ingen årsag) for syge den dag. Alle med adgang til afdelingen må kalde den, så øvrige roller kan se "Fraværende" uden at kende årsagen.

**Frontend**
- Ny hook `useSickToday(date)`: administratorer/skadeledere henter fra `sick_days` (id + årsag), øvrige roller henter kun id-listen via RPC'en. Realtime via eksisterende `subscribeToTable`-helper.
- `EmployeesPage` + `EmployeeTableRow`/`MobileEmployeeCard`: "Syg i dag"-toggle (kun administrator) og statusmærke — rød "Syg" for admin/skadeleder, gul "Fraværende" for andre. Syge indgår i segmentet "Fraværende" og i tællerne.
- Genbrug samme mønster som kursus: syge-id'er føres ind i `EmployeeSelector`, `UnassignedResourcesSection` og dashboard-metrics, så personen er låst/optalt som fraværende (låsetekst: "Fraværende" for ikke-privilegerede roller).
- Ved markering kaldes den eksisterende `vacation-cleanup-assignments`-funktion for netop den dag, så personen fjernes fra dagens opgaver; ved fortrydelse fjernes kun markeringen (opgaver gendannes ikke).
- Danske og engelske oversættelser, `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres.
