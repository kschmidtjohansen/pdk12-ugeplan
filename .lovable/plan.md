## Problem

Planner viser stadig alle "Alle"-opgaver (sub_department_id IS NULL) når man har valgt en underafdeling.

Årsag: RPC'en `list_accessible_assignments_with_team` har en eksplicit fallback i WHERE-klausulen:

```sql
AND (p_sub_department_id IS NULL OR a.sub_department_id = p_sub_department_id OR a.sub_department_id IS NULL)
```

Denne `OR a.sub_department_id IS NULL` tillader alle hoveddeparts-opgaver at lække ind i underafdelings-visningen. Frontend-laget (useUnifiedData / unifiedDataService) er allerede strikt, men planneren læser opgaver via denne RPC, og den vinder.

## Løsning

Ny migration som genskaber `list_accessible_assignments_with_team` (samme signatur og body) med strikt sub-dept filter i begge grene:

```sql
AND (
  (p_sub_department_id IS NULL AND a.sub_department_id IS NULL)
  OR (p_sub_department_id IS NOT NULL AND a.sub_department_id = p_sub_department_id)
)
```

Adfærd:
- Hoveddept valgt (ingen sub) → kun opgaver uden sub_department_id ("Alle").
- Underafdeling valgt → kun opgaver med præcis det sub_department_id. "Alle"-opgaver skjules som ønsket.
- Beholder rolle-grenene (admin/skadeleder/super_admin vs. øvrige), SECURITY DEFINER, search_path='', og logging uændret.

## Filer

1. Ny migration `supabase/migrations/<timestamp>_strict_sub_dept_filter_assignments.sql` med `CREATE OR REPLACE FUNCTION public.list_accessible_assignments_with_team(...)`.
2. `CHANGELOG.md` – tilføj entry under 2026-06-11: "Fix: Underafdeling viser ikke længere 'Alle'-opgaver (strikt sub_department_id-filter i RPC)."
3. `docs/implementation-plan/tasks.md` – marker tilhørende isolerings-task som færdig.

Ingen ændringer i frontend nødvendige – filteret bliver allerede sendt korrekt via `p_sub_department_id`.

## Bekræftelse efter deploy

- Skift til en underafdeling og bekræft at "Alle"-opgaver forsvinder fra Planner.
- Skift til hoveddept (ingen sub) og bekræft at "Alle"-opgaver stadig vises.
