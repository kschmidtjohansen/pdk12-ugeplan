

## Fix: Vagtoprettelse fejler + RLS mangler super_admin

### Rodaarsag

Knappen "Tildel" klikker korrekt, men INSERT i databasen blokeres af RLS-politikken paa `on_call_duties`. Politikken "Admin and skadeleder can manage all duties" tjekker KUN for `administrator` og `skadeleder` -- den mangler `super_admin`.

Funktionen `is_admin_or_skadeleder()` inkluderer korrekt `super_admin`, men `on_call_duties`-politikken bruger IKKE denne funktion -- den har en inline check.

Derudover viser fejlhaandteringen i `useDutyActions.ts` ikke fejlen korrekt, fordi PostgrestError ikke er `instanceof Error`, saa fejlbeskeden bliver tom.

### Beroorte RLS-politikker (inline check uden super_admin)

| Tabel | Policy | Problem |
|-------|--------|---------|
| `on_call_duties` | "Admin and skadeleder can manage all duties" | Mangler super_admin -- **blokerer insert** |
| `planner_change_log` | "Admin and Skadeleder can view logs" | Mangler super_admin |
| `storage.objects` | "Admin and Skadeleder can delete/update assignment files" | Mangler super_admin |

### Loesning

#### 1. SQL Migration: Opdater on_call_duties RLS policy

Erstat inline role-check med `is_admin_or_skadeleder()` funktionen (som allerede inkluderer super_admin):

```sql
DROP POLICY IF EXISTS "Admin and skadeleder can manage all duties" ON on_call_duties;
CREATE POLICY "Admin and skadeleder can manage all duties" ON on_call_duties
  FOR ALL TO authenticated
  USING (is_admin_or_skadeleder())
  WITH CHECK (is_admin_or_skadeleder());
```

Tilsvarende for `planner_change_log` og `storage.objects`.

#### 2. `src/hooks/duty/useDutyActions.ts` -- Fix fejlhaandtering

PostgrestError har `.message` men er ikke `instanceof Error`. AEndr:

```typescript
// Foer:
const errorMessage = err instanceof Error ? err.message : '';

// Efter:
const errorMessage = (err as any)?.message || '';
```

#### 3. `CHANGELOG.md` -- Dokumenter

---

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| Ny SQL migration | Fix 3 RLS policies til at bruge `is_admin_or_skadeleder()` |
| `src/hooks/duty/useDutyActions.ts` | Fix PostgrestError message extraction |
| `CHANGELOG.md` | Dokumenter fix |

