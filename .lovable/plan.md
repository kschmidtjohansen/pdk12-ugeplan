

## Aendringer i Admin-side og Dashboard

### 1. Brugerstyring som foerste fane

**Fil: `src/pages/AdminPage.tsx`**
- AEndr `defaultTab` til altid vaere `'users'` (i stedet for `'departments'` for super_admin)
- Flyt "Brugerstyring" TabsTrigger og TabsContent til foer "Hovedafdelinger" i rækkefølgen

### 2. Super Admin ser dashboard metrics

**Fil: `src/pages/DashboardPage.tsx`**
- Linje 37: AEndr betingelsen fra:
  `effectiveRole === 'administrator' || effectiveRole === 'skadeleder'`
  til:
  `effectiveRole === 'super_admin' || effectiveRole === 'administrator' || effectiveRole === 'skadeleder'`

### 3. Vis antal brugere under Brugerstyring

**Fil: `src/pages/AdminPage.tsx`**
- Tilfoej en taellertekst i CardDescription for brugerstyring-fanen, f.eks. ved at lade `UserManagement` eksponere antallet, eller simplere: tilfoej en separat komponent der henter og viser antal brugere
- Enkleste loesning: Opdater `CardDescription` til at inkludere en lille inline-komponent der querier `profiles`-tabellens raekkeantal og viser "X brugere i alt"

**Alternativ (renere):** Tilfoej en `totalUsers`-prop fra `UserManagement` via en callback, eller opret en simpel inline-query i AdminPage.

Konkret: I `AdminPage.tsx`, tilfoej en `useEffect` der henter antal profiler fra Supabase og vis det i CardDescription.

### 4. Vis antal afdelinger under Hovedafdelinger

**Fil: `src/components/Admin/DepartmentManagement.tsx`**
- Tilfoej en taeller-tekst i CardDescription der viser `departments.length` naar data er loadet, f.eks.: "Opret og administrer hovedafdelinger - {n} afdelinger i alt"

### 5. Oversaettelser

**Fil: `src/translations/da/admin.ts`**
- Tilfoej: `userManagement.totalCount: '{count} brugere i alt'`
- Tilfoej: `departments.totalCount: '{count} afdelinger i alt'`

**Fil: `src/translations/en/admin.ts`**
- Tilfoej: `userManagement.totalCount: '{count} users total'`
- Tilfoej: `departments.totalCount: '{count} departments total'`

---

### Tekniske detaljer

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| `src/pages/AdminPage.tsx` | OPDATER | Brugerstyring som foerste fane + vis brugerantal |
| `src/pages/DashboardPage.tsx` | OPDATER | Tilfoej super_admin til metrics-betingelsen |
| `src/components/Admin/DepartmentManagement.tsx` | OPDATER | Vis afdelingsantal i description |
| `src/translations/da/admin.ts` | OPDATER | Nye oversaettelser for taellere |
| `src/translations/en/admin.ts` | OPDATER | Nye oversaettelser for taellere |

