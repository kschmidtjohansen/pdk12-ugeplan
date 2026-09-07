# Søgning, filtre og sidevisning i adminens brugerliste

Brugerlisten henter i dag alle brugere (ca. 190 i dag) og viser dem i én lang tabel. Der er kun et afdelingsfilter og en A-Z-sortering, så man skal scrolle for at finde en person.

## Hvad der ændres

En ny filterlinje over tabellen:

- **Søgefelt** — søger samtidig i navn og e-mail, med lille forsinkelse så det ikke hakker mens man taster.
- **Rollefilter** — vælg en eller flere roller (administrator, skadeleder, servicemedarbejder, vikar, fugttekniker, super admin). Viser antal pr. rolle.
- **Statusfilter** — aktive / inaktive / alle.
- **Nulstil**-knap der rydder søgning og filtre.
- Det eksisterende afdelingsfilter, sortering og "Tilføj bruger" bliver hvor de er.

Under tabellen kommer en sidevisning:

- 25 brugere pr. side som standard, med valg mellem 25 / 50 / 100.
- Tekst der viser "Viser 1-25 af 190" samt frem/tilbage og sidetal.
- Siden hopper automatisk tilbage til side 1, når man søger eller skifter filter.

Resultatet: listen tegner kun 25 rækker ad gangen i stedet for alle, og man finder en person med et par bogstaver i stedet for at scrolle.

## Teknisk

Ingen ændringer i datahentning, rettigheder eller edge-funktionen `admin-list-users` — alle brugere hentes allerede i ét kald, så filtrering og sidevisning sker i browseren.

Filer:

- `src/components/Admin/UserManagement.tsx`
  - Ny state: `searchTerm` (debounced ~200 ms), `roleFilter: UserRole[]`, `statusFilter: 'all' | 'active' | 'inactive'`, `page`, `pageSize`.
  - Ny `useMemo` `searchedUsers` oven på det eksisterende `filteredUsers` (afdelingsfilter bevares uændret): matcher `name` og `email` case-insensitivt, filtrerer på rolle og status.
  - `paginatedUsers = searchedUsers.slice((page-1)*pageSize, page*pageSize)` sendes til `UserTable`.
  - `useEffect` nulstiller `page` når søgning/filtre/afdeling ændres.
  - Tom-tilstand: hvis der er brugere, men ingen matcher, vises "ingen resultater" + nulstil-knap i stedet for den nuværende "no users found"-fejlblok (den bevares til det tilfælde, hvor listen faktisk er tom).
  - Rollefilteret genbruger `getRoleLabel` og de eksisterende `roleCounts`.
- Ny `src/components/Admin/UserListToolbar.tsx` til søgefelt + filtre, så `UserManagement.tsx` ikke vokser yderligere.
- Ny `src/components/Admin/UserListPagination.tsx` bygget på shadcn `pagination` og `select`.
- Nye da/en-nøgler under `admin.userManagement.*`: `searchPlaceholder`, `filterByRole`, `filterByStatus`, `allRoles`, `allStatuses`, `resetFilters`, `noResults`, `showingRange`, `perPage`.

Design følger de eksisterende admin-komponenter (kompakt, `h-9`-inputs, samme afstande som afdelingsfilteret).

## Verifikation

- Typecheck.
- Preview på /admin: søg på navn og på e-mail, filtrér på rolle og status, skift side og sidestørrelse, kontrollér at redigér/slet/nulstil-kode-knapperne stadig rammer den rigtige bruger.
- `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres.
