

## Rettelser

### Problem 1: Super Admin rolle mangler i medarbejder-redigeringsdialogen
Filen `src/components/Employees/EmployeeFormDialog.tsx` (linje 412-417) viser kun 4 roller: administrator, skadeleder, servicemedarbejder, vikar. `super_admin` er ikke tilgængelig, hvilket betyder at en Super Admin ikke kan tildele denne rolle ved redigering.

### Problem 2: Super Admin label
Oversættelserne viser allerede "Super Admin" i begge sprog, men da rollen slet ikke vises i dropdown, kan brugeren ikke se den. Når den tilføjes, vil den korrekte label vises.

---

### Ændring i `src/components/Employees/EmployeeFormDialog.tsx`

1. Importer `useAuth` fra `@/context/AuthContext` (ved siden af eksisterende `usePermissions`)
2. Tilføj `const { user: authUser } = useAuth();` og `const isSuperAdmin = authUser?.role === 'super_admin';` i komponenten
3. Tilføj `super_admin` SelectItem i rolle-dropdown, gated bag `isSuperAdmin`:

```tsx
<SelectContent>
  {isSuperAdmin && (
    <SelectItem value="super_admin">{t("employees.super_admin")}</SelectItem>
  )}
  <SelectItem value="administrator">{t("employees.administrator")}</SelectItem>
  ...
</SelectContent>
```

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Employees/EmployeeFormDialog.tsx` | Tilføj `useAuth`, `isSuperAdmin`-check, og `super_admin` SelectItem |

