## Problem

Demo-data (fx sag "1221" og "Demo User" i afd. 12 - Fredericia) vises i live view for almindelige brugere. Skærmbilledet bekræfter at en demo-genereret opgave dukker op blandt rigtige sager.

## Årsag

Alle `hide_demo_data_*` RLS-politikker er oprettet som **PERMISSIVE** i stedet for **RESTRICTIVE**. PERMISSIVE-politikker kombineres med OR — så `hide_demo_data_assignments` (kun synlig hvis `is_demo = false` eller bruger er demo-brugeren) bliver OR'et med `Users can view accessible assignments` (som tillader adgang baseret på afdeling). Resultatet: enhver bruger med adgang til afd. 12 ser også demo-rækker.

Tabeller berørt:
- `assignments`, `assignments_employees`, `cars`, `notifications`, `on_call_duties`, `profiles`, `vacations`, `warehouse_items`

## Løsning

Migration der dropper hver `hide_demo_data_*` SELECT-politik og genopretter den som `RESTRICTIVE`, så `is_demo = true` rækker kun er synlige for demo-brugeren `165cdbc9-6722-4c96-97d2-1a87185c8133` — uanset hvilke andre PERMISSIVE policies der findes.

```sql
-- Mønster pr. tabel:
DROP POLICY "hide_demo_data_assignments" ON public.assignments;
CREATE POLICY "hide_demo_data_assignments"
  ON public.assignments
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (
    is_demo = false
    OR (SELECT auth.uid()) = '165cdbc9-6722-4c96-97d2-1a87185c8133'::uuid
  );
```

Samme transformation gentages for:
- `assignments_employees` (filter via JOIN på `assignment_id` eller egen `is_demo` kolonne — bevarer eksisterende predicate)
- `cars`, `notifications`, `vacations`, `warehouse_items`, `profiles`, `on_call_duties`

Eksisterende predicate bevares 1:1; kun policy-typen ændres til RESTRICTIVE.

## Verifikation

1. Login som almindelig bruger på afd. 12 → demo-sag "1221" og "Demo User" skal ikke længere være synlig i planner.
2. Login som demo-bruger (`test@polygongroup.com`) → demo-data skal fortsat være synlig.
3. Kør `supabase--linter` for at sikre ingen nye advarsler.

## Dokumentation

- Opdater `CHANGELOG.md` med fixet.
- Opdater `docs/implementation-plan/tasks.md` med `[x]` for denne sikkerhedsopgave.
- Tilføj/opdater `mem://system/security-and-architecture-specs` med reglen: "hide_demo_data_* policies MUST be RESTRICTIVE — PERMISSIVE OR'er med andre SELECT-policies og lækker demo-data."
