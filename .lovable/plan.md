## Problem

Cron-jobbet `auto-publish-assignments` kører hvert minut, men fejler hver gang siden migration `20260515161356`. Funktionen `public.auto_publish_due_assignments()` refererer til kolonnen `date` på `public.assignments`, men kolonnen hedder `assignment_date`.

Verificeret via `cron.job_run_details`: alle kørsler returnerer:
```
ERROR: column "date" does not exist
QUERY: SELECT DISTINCT department_id FROM public.assignments WHERE published = false AND date <= ...
```

Ingen opgaver bliver derfor auto-publiceret, og `auto_publish_log` får ingen nye rækker.

## Løsning

Migration der erstatter funktionen med korrekt kolonnenavn `assignment_date` (samme logik som første version af funktionen). Pr.-afdelings-logging til `auto_publish_log` bibeholdes.

```sql
CREATE OR REPLACE FUNCTION public.auto_publish_due_assignments()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated integer := 0;
  v_total   integer := 0;
  v_dept    record;
BEGIN
  FOR v_dept IN
    SELECT DISTINCT department_id
    FROM public.assignments
    WHERE published = false
      AND assignment_date <= (now() AT TIME ZONE 'Europe/Copenhagen')::date
  LOOP
    WITH upd AS (
      UPDATE public.assignments
      SET published = true,
          updated_at = now()
      WHERE published = false
        AND assignment_date <= (now() AT TIME ZONE 'Europe/Copenhagen')::date
        AND department_id IS NOT DISTINCT FROM v_dept.department_id
      RETURNING 1
    )
    SELECT COUNT(*) INTO v_updated FROM upd;

    INSERT INTO public.auto_publish_log (run_at, assignments_updated, department_id, triggered_by)
    VALUES (now(), v_updated, v_dept.department_id, 'cron');

    v_total := v_total + v_updated;
  END LOOP;

  RETURN v_total;
END;
$$;
```

Efter migration kører jeg funktionen manuelt én gang for at indhente backlog af kladder hvis dato allerede er passeret, og verificerer via `cron.job_run_details` og `auto_publish_log`.

## Opfølgning

- Opdater `CHANGELOG.md` med fix-noten.
- Tilføj `[x]`-entry i `docs/implementation-plan/tasks.md` under bug-fixes.