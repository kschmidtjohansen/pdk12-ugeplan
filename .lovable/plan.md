
## Rodårsag: Opgave med department_id = NULL vises på tværs af alle afdelinger

### Hvad der er sket (detektivarbejde)

Opgave `14-000686` (ID: `792649a1-3507-4106-a8b4-7fc855310000`) er oprettet af **Michael Rattenborg** (Afd. 14 - Asnæs) d. 18. feb 2026 og har **`department_id = NULL`** i databasen.

**Årsagen til `department_id = NULL`**: Det er et teknisk edge-case: Opgaven er blevet oprettet på et tidspunkt, hvor `selectedDepartmentId` i DepartmentContext **ikke var klar** (null/undefined) — fx ved hurtig navigation eller session-genoprettelse. Koden sender da `department_id: selectedDepartmentId || null` — og dette null gemmes i databasen.

### Den kritiske fejl i RPC-funktionen

`list_accessible_assignments_with_team` indeholder denne WHERE-betingelse for administratorer/skadeledere:

```sql
WHERE (p_department_id IS NULL OR a.department_id = p_department_id OR a.department_id IS NULL)
```

Betingelsen `a.department_id IS NULL` betyder: **"vis opgaven, uanset hvilken afdeling der er valgt"**. Det var tænkt som en sikkerhed for generelle opgaver, men det medfører, at en opgave fra Afd. 14 (der bare mangler department_id) vises for alle afdelinger — inkl. Afd. 12 - Fredericia.

Samme fejl gælder for servicemedarbejdere (samme mønster i ELSE-grenen).

### Løsning (tre lag)

**Lag 1 - Ret den eksisterende NULL-opgave (data-fix)**  
Sæt `department_id = '63d46993-31cb-4921-bb3d-5934984ab6b3'` (14 - Asnæs) på opgave `792649a1-...` da den klart tilhører Afd. 14 (responsible user er Michael Rattenborg fra Afd. 14, alle tilknyttede medarbejdere er fra Afd. 14).

**Lag 2 - Ret RPC-funktionen (forhindrer fremtidige lækager)**  
Fjern `OR a.department_id IS NULL` fra WHERE-betingelsen. Opgaver uden department_id skal kun vises, når der *ikke* er valgt en specifik afdeling (`p_department_id IS NULL`):

```sql
-- FØR (fejlagtig):
WHERE (p_department_id IS NULL OR a.department_id = p_department_id OR a.department_id IS NULL)

-- EFTER (korrekt):
WHERE (p_department_id IS NULL OR a.department_id = p_department_id)
```

Dette gælder begge grene (administrator/skadeleder og servicemedarbejder) i funktionen.

**Lag 3 - Frontend-guard (forhindrer NULL-oprettelse)**  
I `useOptimizedAssignments.ts` skal `createAssignment` afvise kald, hvis `selectedDepartmentId` er null og brugeren ikke er i demo-mode — i stedet for stiltiende at gemme `department_id: null`.

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| Database migration | Fix NULL department_id på opgave 792649a1 + ret RPC-funktion |
| `src/hooks/useOptimizedAssignments.ts` | Guard mod oprettelse uden department_id |
| `CHANGELOG.md` | Dokumenter security-fix |

### Kvalitetstjek
- Opgave 14-000686 vises ikke længere i Fredericia
- Alle fremtidige opgaver tildeles korrekt department_id ved oprettelse
- RPC returnerer kun opgaver tilhørende den valgte afdeling
- Ingen ændring i oplevelsen for Afd. 14 - Asnæs brugere
- Overholder tekniske specs (multi-tenant isolation, afdeling-baseret dataadgang)
