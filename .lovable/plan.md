
## Udvid Admin-siden med By-administration, Underafdelinger og Brugertildeling

### Del 1: By-administration (Kun Super Admin)

**Ny fil**: `src/components/Admin/DepartmentManagement.tsx`

En ny sektion paa admin-siden der kun vises for `super_admin`:
- Viser liste over alle hovedafdelinger (byer) fra `departments`-tabellen
- Formular til at oprette nye byer (Input + knap)
- Mulighed for at slette byer (med bekraeftelsesdialog)
- Alt UI paa dansk: "Hovedafdelinger (Byer)", "Opret ny by", "Slet"

### Del 2: Underafdelings-administration

**Ny fil**: `src/components/Admin/SubDepartmentManagement.tsx`

Vises for baade `super_admin` og `administrator`:
- Viser underafdelinger grupperet under den valgte hovedafdeling
- Administratorer ser kun underafdelinger for den by de er tilknyttet
- Super Admins kan vaelge hvilken by de vil administrere underafdelinger for
- Formular til at oprette nye underafdelinger (f.eks. "Asbest", "Skimmel")
- Mulighed for at slette underafdelinger
- Alt UI paa dansk

### Del 3: Brugertildeling til afdeling i UserFormDialog

**Opdater**: `src/components/Admin/UserFormDialog.tsx`

Tilfoej to nye felter i bruger-editoren:
- **Hovedafdeling**: Dropdown med tilgaengelige byer (baseret paa admins rolle)
- **Underafdelinger**: Multi-select checkboxes med underafdelinger under den valgte by
- Ved oprettelse/opdatering: Opret/opdater raekker i `user_access`-tabellen med valgt `department_id` og `sub_department_id`
- Ved redigering: Forhaandsindlaes brugerens eksisterende tildelinger fra `user_access`

### Del 4: Opdater AdminPage layout

**Opdater**: `src/pages/AdminPage.tsx`

- Tilfoej `DepartmentManagement` som ny Card-sektion (kun synlig for super_admin)
- Tilfoej `SubDepartmentManagement` som ny Card-sektion (synlig for super_admin og administrator)
- Bevar eksisterende `UserManagement`-sektion
- Tilfoej rolletjek: `user.role === 'super_admin'` for by-administration
- Udvid adgangstjekket saa baade `administrator` og `super_admin` kan tilgaa admin-siden

### Del 5: Quick-switch i topbar (allerede implementeret)

`DepartmentSelector.tsx` er allerede implementeret i topbaren og fungerer som quick-switch for Super Admins. Ingen yderligere aendringer nødvendige.

### Del 6: Oversaettelser

**Opdater**: `src/translations/da/admin.ts` og `src/translations/en/admin.ts`

Tilfoej nye noegeler:
- `departments.title`: "Hovedafdelinger (Byer)"
- `departments.create`: "Opret ny by"
- `departments.name`: "Bynavn"
- `departments.delete`: "Slet by"
- `departments.deleteConfirm`: "Er du sikker paa at du vil slette denne by?"
- `departments.deleteWarning`: "Alle underafdelinger og brugertilknytninger til denne by vil ogsaa blive slettet."
- `subDepartments.title`: "Underafdelinger"
- `subDepartments.create`: "Opret underafdeling"
- `subDepartments.name`: "Underafdelingsnavn"
- `subDepartments.delete`: "Slet underafdeling"
- `userManagement.department`: "Hovedafdeling"
- `userManagement.subDepartments`: "Underafdelinger"
- `userManagement.selectDepartment`: "Vælg hovedafdeling"
- `userManagement.selectSubDepartments`: "Vælg underafdelinger"

---

### Tekniske detaljer

**Database**: Ingen nye tabeller - bruger eksisterende `departments`, `sub_departments` og `user_access` tabeller.

**RLS-politikker**: Allerede paa plads:
- `departments`: Super admins kan oprette/slette, alle kan laese
- `sub_departments`: Super admins og afdelingsadmins kan CRUD, alle kan laese
- `user_access`: Super admins og afdelingsadmins kan CRUD, brugere kan se egne

**Filliste**:

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| `src/components/Admin/DepartmentManagement.tsx` | NY | By-administration UI |
| `src/components/Admin/SubDepartmentManagement.tsx` | NY | Underafdelings-administration UI |
| `src/components/Admin/UserFormDialog.tsx` | OPDATER | Tilfoej afdeling/underafdeling-felter |
| `src/pages/AdminPage.tsx` | OPDATER | Tilfoej nye sektioner, udvid adgangstjek |
| `src/translations/da/admin.ts` | OPDATER | Nye danske tekster |
| `src/translations/en/admin.ts` | OPDATER | Nye engelske tekster |
