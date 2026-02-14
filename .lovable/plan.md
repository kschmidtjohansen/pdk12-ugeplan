

## Aendringer

### 1. DepartmentSelector: Vis kun afdelingsnummer i headeren

**Fil:** `src/components/Layout/NavComponents/DepartmentSelector.tsx`

Afdelingsnavne foelger formatet "12-Fredericia". I header-knappen vises kun nummeret foer bindestregen (f.eks. "12"). I dropdown-listen vises det fulde navn som hidtil.

- Tilfoej en hjaelpefunktion: `const getShortName = (name: string) => name.split('-')[0]?.trim() || name;`
- Brug `getShortName()` paa button-teksten (linje 55) og paa single-department visningen (linje 39)
- Dropdown-items beholder det fulde navn

### 2. Kun super_admins kan tildele super_admin-rollen

**Fil:** `src/components/Admin/UserFormDialog.tsx`

Rollelisten inkluderer i dag kun `administrator`, `skadeleder` og `servicemedarbejder`. Super_admin-rollen skal tilfoejes som valgmulighed, men kun vises naar den indloggede bruger selv er super_admin.

- Linje 354-358: Tilfoej en betinget `<SelectItem value="super_admin">` der kun renders naar `isSuperAdmin === true` (variablen eksisterer allerede paa linje 82)

### Filer der aendres

| Fil | Aendring |
|-----|----------|
| `src/components/Layout/NavComponents/DepartmentSelector.tsx` | Vis kun nummer-prefix i header-knap |
| `src/components/Admin/UserFormDialog.tsx` | Tilfoej betinget super_admin rolle-valg |

### Sikkerhed
- Ingen database-aendringer
- Super_admin-rollen beskyttes allerede af backend (user_roles RLS) -- dette er udelukkende en UI-begraensning
- Ingen UI-elementer fjernes

