

## Fase 9d (fortsat): pg_cron job + Demo DB-skrivninger

### Overblik

To udestaaende opgaver fra Fase 9d:

1. **pg_cron job**: Automatisk oprydning af `is_demo = true` data aeldre end 15 minutter
2. **Migrering af demo-skrivninger fra sessionStorage til database**: Flere steder bruger stadig `DemoUserService` (sessionStorage) til at gemme demo-data i stedet for at skrive til databasen med `is_demo: true`

---

### 1. pg_cron job opsaetning

Koerer som SQL INSERT (ikke migration) via Supabase SQL Editor:

```text
-- Aktiver pg_cron og pg_net extensions (hvis ikke allerede)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule: kald cleanup_demo_data_ttl() hvert minut
SELECT cron.schedule(
  'cleanup-demo-data-ttl',
  '* * * * *',
  $$ SELECT cleanup_demo_data_ttl(); $$
);
```

### 2. Demo-skrivninger: sessionStorage til database

Foelgende kodestier bruger stadig `DemoUserService` (sessionStorage) og skal migreres til at skrive direkte til databasen med `is_demo: true`:

| Fil | Nuvaerende adfaerd | Ny adfaerd |
|-----|-------------------|-----------|
| `src/services/optimizedAssignmentService.ts` (createAssignment, linje 521-551) | Gemmer i `DemoUserService.storeDemoAssignment()` | Skriver til `assignments`-tabellen med `is_demo: true` via Supabase |
| `src/services/optimizedAssignmentService.ts` (updateAssignment, linje 597-620) | Opdaterer i `DemoUserService` | Opdaterer via Supabase `.update()` |
| `src/services/optimizedAssignmentService.ts` (deleteAssignment, linje ~650+) | Sletter fra `DemoUserService` | Sletter via Supabase `.delete()` |
| `src/services/optimizedAssignmentService.ts` (fetchAllAssignments, linje 307-311) | Merger baseline + `DemoUserService.getDemoAssignments()` | Fjern local-merge; RPC returnerer allerede `is_demo`-data for demo-brugeren via RLS |
| `src/hooks/car/useCarActions.ts` (confirmDelete, linje 40-72) | Sletter fra `DemoUserService.deleteDemoCar()` | Sletter via Supabase `.delete()` med `.eq('id', carId)` |
| `src/hooks/car/useCarData.ts` (fetchCarsFn, linje 51-52) | Merger baseline + `DemoUserService.getDemoCars()` | Fjern local-merge; RPC/query returnerer allerede demo-data via RLS |
| `src/hooks/warehouse/useWarehouseActions.ts` (createItem, linje 34-38) | Kalder `localHandlers.addLocalItem()` (kun lokal state) | Skriver til `warehouse_items` med `is_demo: true` via Supabase |
| `src/hooks/warehouse/useWarehouseActions.ts` (updateItem, linje 103-107) | Kalder `localHandlers.updateLocalItem()` | Opdaterer via Supabase |
| `src/hooks/warehouse/useWarehouseActions.ts` (deleteItem, linje 161-165) | Kalder `localHandlers.deleteLocalItem()` | Sletter via Supabase |

### 3. Beroorte filer (samlet)

| Fil | Aendring |
|-----|---------|
| `src/services/optimizedAssignmentService.ts` | Erstat demo sessionStorage-logik med DB-skrivninger (`is_demo: true`). Fjern `DemoUserService`-import og -kald. I `fetchAllAssignments` demo-blok: fjern local-merge |
| `src/hooks/car/useCarActions.ts` | Erstat `DemoUserService`-sletning med Supabase `.delete()` |
| `src/hooks/car/useCarData.ts` | Fjern `DemoUserService.getDemoCars()` merge i demo fetch |
| `src/hooks/warehouse/useWarehouseActions.ts` | I demo-mode: skriv til DB med `is_demo: true` i stedet for lokale handlers |
| `CHANGELOG.md` | Dokumenter aendringer |

### 4. Teknisk implementering

#### OptimizedAssignmentService.createAssignment (demo-blok):

```text
// FØR: DemoUserService.getInstance().storeDemoAssignment(...)
// EFTER:
const { employees, ...assignmentInsert } = assignmentData;
assignmentInsert.is_demo = true;
const { data, error } = await supabase.from('assignments').insert(assignmentInsert).select().single();
if (error) throw error;
// Link employees med is_demo: true
if (employees?.length) {
  await supabase.from('assignments_employees').insert(
    employees.map(uid => ({ assignment_id: data.id, user_id: uid, is_demo: true }))
  );
}
```

#### OptimizedAssignmentService.fetchAllAssignments (demo-blok):

```text
// FØR: merger baseline RPC + DemoUserService.getDemoAssignments()
// EFTER: kun RPC-data (RLS tillader allerede demo-brugeren at se is_demo=true)
const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
return data ? this.convertDemoAssignments(data) : [];
// Ingen local-merge nødvendig
```

#### useWarehouseActions.createItem (demo-blok):

```text
// FØR: localHandlers?.addLocalItem?.(data)
// EFTER:
const { data: { user } } = await supabase.auth.getUser();
await supabase.from('warehouse_items').insert({
  ...data,
  created_by: user?.id,
  department_id: selectedDepartmentId || null,
  sub_department_id: selectedSubDepartmentId || null,
  is_demo: true,
});
queryClient.invalidateQueries({ queryKey: ['warehouse-items'] });
```

### 5. Logging-haandtering (jf. Knowledge)

- Alle nye `console.log` wraps i `import.meta.env.DEV`
- Ingen foelsom data logges (ingen bruger-ID, email, passwords)
- `console.error` beholdes for fejlhaandtering

### 6. Kvalitetstjek

- Live-brugere forbliver 100% beskyttet via RESTRICTIVE RLS-politikker
- Demo-data gemmes nu i databasen og ryddes automatisk via pg_cron
- sessionStorage-afhaengighed elimineres for datapersistering
- Afdelingsisolering (Fase 9c) forbliver intakt via `isDemoNonHomeDepartment`

### 7. Raekkefoelge

1. pg_cron job (via SQL INSERT)
2. Opdater `optimizedAssignmentService.ts` (create/update/delete/fetch)
3. Opdater `useCarActions.ts` og `useCarData.ts`
4. Opdater `useWarehouseActions.ts`
5. Dokumentation (CHANGELOG.md)
