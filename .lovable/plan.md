

## Afdelingsswitch-animation + Admin-undersider

### Del 1: Animation ved afdelingsskift

**Fil: `src/components/Layout/NavComponents/DepartmentSelector.tsx`**

- Tilfoej en visuel animation naar brugeren skifter afdeling i dropdown'en
- Vis en kort toast-besked med den nye afdelings navn (f.eks. "Skiftet til 12-Fredericia")
- Tilfoej en fade-in animation paa DepartmentSelector-knappen naar vaerdien skifter (kort flash/highlight-effekt med `animate-fade-in` fra eksisterende keyframes)

---

### Del 2: Admin-side opdelt i undersider med Tabs

**Fil: `src/pages/AdminPage.tsx`**

- Erstat den nuvaerende lineaere layout med Radix UI Tabs-komponent (allerede installeret)
- Tre tabs:
  1. **Hovedafdelinger** (kun synlig for Super Admin) -- viser `DepartmentManagement`
  2. **Underafdelinger** -- viser `SubDepartmentManagement`
  3. **Brugerstyring** -- viser `UserManagement` (indkapslet i Card)
- Standard-tab: "Brugerstyring" for alle, "Hovedafdelinger" for Super Admin
- Hvert tab-indhold faar `animate-fade-in` animation ved skift

---

### Del 3: Redigering af hovedafdelingsnavn

**Fil: `src/components/Admin/DepartmentManagement.tsx`**

- Tilfoej inline-redigering: klik paa afdelingsnavnet -> det bliver et inputfelt
- Tilfoej en "Gem"-knap (checkmark-ikon) og "Annuller"-knap (X-ikon)
- Kald `supabase.from('departments').update({ name }).eq('id', dept.id)` ved gem
- Vis toast ved succes/fejl

---

### Del 4: Redigering af underafdelingsnavn + sikker sletning

**Fil: `src/components/Admin/SubDepartmentManagement.tsx`**

- Tilfoej inline-redigering af underafdelingsnavn (samme moenster som hovedafdelinger)
- Ved sletning: Foer sletning, tjek om underafdelingen har tilknyttede data:
  - Tjek `user_access` WHERE `sub_department_id = id`
  - Tjek `assignments` WHERE `sub_department_id = id` (hvis kolonnen findes)
  - Hvis data findes: vis advarsel "Denne underafdeling har tilknyttede brugere/data og kan ikke slettes"
  - Hvis ingen data: tillad sletning som nu
- Tilfoej "Rediger"-knap (blyant-ikon) ved siden af sletknappen

---

### Del 5: Oversaettelser

**Filer: `src/translations/da/admin.ts`, `src/translations/en/admin.ts`**

Nye noegler:
- `departments.rename` / `departments.renamed`: "Omdoeb" / "Afdelingsnavn opdateret"
- `departments.editName`: "Rediger navn" / "Edit name"
- `subDepartments.rename` / `subDepartments.renamed`: "Omdoeb" / "Underafdelingsnavn opdateret"
- `subDepartments.editName`: "Rediger navn" / "Edit name"
- `subDepartments.hasData`: "Kan ikke slettes - har tilknyttede data" / "Cannot delete - has associated data"
- `tabs.departments`: "Hovedafdelinger" / "Main Departments"
- `tabs.subDepartments`: "Underafdelinger" / "Sub-departments"
- `departmentSwitched`: "Skiftet til {name}" / "Switched to {name}"

---

### Tekniske detaljer

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| `src/pages/AdminPage.tsx` | OPDATER | Tabs-layout med tre undersider |
| `src/components/Admin/DepartmentManagement.tsx` | OPDATER | Tilfoej inline-redigering af navn |
| `src/components/Admin/SubDepartmentManagement.tsx` | OPDATER | Tilfoej redigering + sikker sletning |
| `src/components/Layout/NavComponents/DepartmentSelector.tsx` | OPDATER | Animation + toast ved skift |
| `src/translations/da/admin.ts` | OPDATER | Nye danske oversaettelser |
| `src/translations/en/admin.ts` | OPDATER | Nye engelske oversaettelser |

