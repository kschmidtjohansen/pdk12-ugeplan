

## Plan: Flyt afdelingsvælger til profilmenuen

### Problem
DepartmentSelector i navbar'en skjules på mindre skærme (`hidden md:flex`), hvilket gør det svært for super admins at skifte afdeling.

### Løsning
Integrer afdelingsvælger-funktionaliteten direkte i UserMenu-dropdown'en (profilbilledet), så den altid er tilgængelig uanset skærmstørrelse. Fjern den fra navbar'en.

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| **`src/components/Layout/NavComponents/UserMenu.tsx`** | Importer `useDepartment` og `Building2`/`Layers` ikoner. Tilføj en "Afdeling"-sektion i dropdown'en (efter brugerinfo, før demo-rolle). Vis afdelinger som `DropdownMenuRadioGroup` med `DropdownMenuRadioItem` for hver afdeling. Vis underdepartment-vælger nedenunder hvis relevant. Kun synlig når `userDepartments.length > 1`. |
| **`src/components/Layout/TopNavbar.tsx`** | Fjern `DepartmentSelector`-importen og dens `<div className="hidden md:flex">` wrapper (linje 139-141). |
| **`src/components/Layout/NavComponents/MobileNavigation.tsx`** | Fjern `DepartmentSelector`-importen og dens `<div>` wrapper i mobile menuen (linje ~93-95). |

### UserMenu — ny sektion (pseudo-kode)

Placeres lige efter `DropdownMenuSeparator` (linje 90), før demo-rolle sektionen:

```
{userDepartments.length > 1 && (
  <>
    <DropdownMenuLabel>
      <Building2 icon /> Afdeling
    </DropdownMenuLabel>
    <DropdownMenuRadioGroup value={selectedDepartmentId} onChange={switchDepartment}>
      {userDepartments.map(dept => <DropdownMenuRadioItem .../>)}
    </DropdownMenuRadioGroup>
    {userSubDepartments.length > 1 && (
      <DropdownMenuRadioGroup value={selectedSubDepartmentId} onChange={...}>
        {userSubDepartments.map(sub => <DropdownMenuRadioItem .../>)}
      </DropdownMenuRadioGroup>
    )}
    <DropdownMenuSeparator />
  </>
)}
```

### Scope
3 filer, kun UI-flytning. Ingen logik- eller dataændringer.

