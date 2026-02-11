

## Fix: RPC-overload fejl på ugeplanen (PGRST203)

### Problem

Fejlen er: **"Could not choose the best candidate function between: public.list_accessible_assignments_with_team(), public.list_accessible_assignments_with_team(p_department_id => uuid)"**

Der er to problemer:

1. **Database**: Den forrige migration brugte `CREATE OR REPLACE`, som kun erstatter funktioner med samme signatur. Den gamle funktion uden parametre eksisterer stadig ved siden af den nye med `p_department_id`. PostgreSQL kan ikke vaelge mellem dem.

2. **Frontend**: `src/services/enhancedDataFetching.ts` (linje 424) kalder RPC'en **uden** `p_department_id`-parameteren, hvilket udloeser tvetydigheden.

### Loesning

**Fil 1: Ny migration SQL**
- Drop den gamle funktion uden parametre: `DROP FUNCTION IF EXISTS public.list_accessible_assignments_with_team();`
- Dette efterlader kun versionen med `p_department_id` (som har `DEFAULT NULL`, saa den ogsaa virker uden parameter)

**Fil 2: `src/services/enhancedDataFetching.ts`**
- Opdater linje 424 til at sende `p_department_id` parameteren eksplicit (kan vaere `null`):
  ```typescript
  .rpc('list_accessible_assignments_with_team', { p_department_id: null })
  ```

### Tekniske detaljer

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| Migration SQL | NY | Drop gammel funktion uden parametre |
| `src/services/enhancedDataFetching.ts` | OPDATER | Send `p_department_id: null` eksplicit |

Rettelsen er minimal og loser begge fejlmeddelelser paa planner-siden.

