## Plan: 4 ændringer (multi-role, kørertøjer i underafdeling, hurtig sub-dept navigation, “Alle”-restriktion)

### 1) Multi-role pr. medarbejder
**DB-migration:**
```sql
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;
DROP INDEX IF EXISTS public.user_roles_user_id_unique;
-- bevarer UNIQUE(user_id, role) så samme rolle ikke kan tildeles to gange.
```

**Rolle-hierarki (mest → mindst privilegeret)** — ny utility `src/utils/roleHierarchy.ts`:
```
super_admin > administrator > skadeleder > fugttekniker > servicemedarbejder > vikar
```
Eksporter `getEffectiveRole(roles: UserRole[]): UserRole` og `ROLE_RANK`. Bruges overalt hvor vi i dag aflæser én rolle.

**`AuthContext.tsx`:**
- Skift fetch til `maybeSingle()` → `.select('role').eq('user_id', authUser.id)` (alle rækker).
- Gem `user.roles: UserRole[]` på `user`-objektet og behold `user.role` som “primær (highest) rolle” for bagudkompatibilitet.
- `currentRole` (linje 597) beregnes som `getEffectiveRole(user.roles)`; demo-override uændret.
- Alle `isAdmin`/`isSkadeleder`/`canEdit`-flag baseres fortsat på `currentRole` (= højeste rolle). Dermed får “Skadeleder + Fugttekniker” skadeleder-rettigheder automatisk.

**Admin UI — `UserFormDialog.tsx`:**
- Erstat rolle-`Select` med en multi-select (checkbox-liste med rolle-badge-farver, samme stil som rolle-prompt i underafdelinger). Mindst én rolle krævet.
- Send `roles: UserRole[]` til edge-funktionerne.

**Edge functions:**
- `admin-user-role/index.ts`: accepter `roles: string[]` (fallback til `role: string` for bagudkompat). Lav `DELETE FROM user_roles WHERE user_id=$1` + `INSERT` af alle nye roller i én transaktion (eller `upsert` + diff).
- `admin-create-user/index.ts`: samme — indsæt alle valgte roller.

**Visning:** `UserTableRow` viser rolle-badges for alle roller i den rækkefølge hierarkiet definerer (highest først).

### 2) Vælg køretøjer ved oprettelse af underafdeling
Tabel `car_sub_departments(car_id, sub_department_id)` findes allerede — bruges direkte.

**`SubDepartmentManagement.tsx`** (eksisterende create/edit-dialog udvides):
- Hent køretøjer for valgt afdeling: `cars.select('id, name, car_number').eq('department_id', selectedDeptId).order('name')`.
- Tilføj sektion under "Synlige roller": **"Køretøjer"** med checkbox pr. køretøj (samme visuelle stil som rolle-checkboxene). Default: ingen forvalgt ved oprettelse; ved redigering forudfyldt fra `car_sub_departments`.
- Ved gem:
  - Insert/update `sub_departments`-rækken som i dag.
  - `DELETE FROM car_sub_departments WHERE sub_department_id=<id>` + bulk-insert af de afkrydsede `car_id`er.
- Vis et lille car-tæller-badge på listen ved hver underafdeling (f.eks. "3 køretøjer").

### 3) Hurtig sub-dept-navigation på dashboard
Ny komponent `src/components/Dashboard/SubDepartmentQuickSwitcher.tsx`:
- Vises i `DashboardPage` lige under `WelcomeHeader` (kun hvis `userSubDepartments.length > 1`).
- Horisontal scroll-bar med pille-knapper: én pr. underafdeling + en "Alle"-pille i venstre side (kun synlig hvis brugeren må se "Alle", jf. punkt 4).
- Aktiv pille fremhæves med primary-bg. Klik = `setSelectedSubDepartmentId(...)`.
- Brug `getSubDepartmentColor`/badge-styling så det matcher resten af dashboardet (kompakt, `rounded-full`, `text-xs`, `px-3 py-1.5`).

### 4) "Alle"-underafdeling kun for Administrator + Super Admin
- I `DepartmentContext.tsx` (fetch sub-departments-effect): For ikke-admin brugere skal `selectedSubDepartmentId` aldrig være `null` så længe `userSubDepartments.length > 0` — det er allerede tilfældet, så ingen ændring i context.
- I `UserMenu.tsx` (linje 119-121) og `DepartmentSwitcherPill.tsx`: vis kun "Alle"-`DropdownMenuRadioItem`/option når `isAdmin || isSuperAdmin` (via `usePermissions`). Ellers udelad punktet.
- I den nye `SubDepartmentQuickSwitcher`: samme gating.
- I `DepartmentContext`’s sub-dept-effect: hvis ikke-admin og current `selectedSubDepartmentId === null`, sæt automatisk til første tilgængelige sub-dept (allerede sådan — bare bekræft).

### Changelog
Tilføj entry i `CHANGELOG.md`:
`2026-06-11 — Multi-rolle pr. medarbejder · Køretøjer i underafdeling · Hurtig sub-dept switch på dashboard · "Alle" begrænset til admin/super admin`

### Tekniske noter
- Ingen RLS-policy ændringer — eksisterende `has_role(_user_id, _role)`-funktion virker stadig med flere rækker.
- Bagudkompatibilitet: `user.role` bevares som derived "primary role" så ingen anden komponent skal røres.
- `car_sub_departments` har allerede RLS-politikker (4 stk.) — ingen schema-ændring nødvendig.
