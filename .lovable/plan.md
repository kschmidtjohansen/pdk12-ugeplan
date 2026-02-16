

## Fase 9f: Fix manglende opgaver + vagter (NULL department_id)

### Problem 1: Opgaver vises ikke i planner

10 opgaver (inkl. 12-013546 "Haandvaerkervej 23") har `department_id = NULL` i databasen. RPC'en `list_accessible_assignments_with_team` filtrerer med `a.department_id = p_department_id`, og da `NULL != valgt_afdeling`, udelukkes disse opgaver.

Beroorte opgaver:
| Titel | Dato | Publiceret |
|-------|------|-----------|
| 12-013281 | 17-20 feb | Ja |
| 12-013486 | 18-19 feb | Nej |
| 12-013546 | 16 feb | Ja |
| 12-013519 | 16 feb | Ja |
| 12-013517 | 16 feb | Ja |
| 12-013127 | 13 feb | Ja |

### Problem 2: Vagter gemmes men vises ikke

`useDutyActions.ts` indsaetter vagter uden `department_id`/`sub_department_id`. `useDutyData.ts` filtrerer med `.eq('department_id', selectedDepartmentId)`. Resultat: 21 af 194 vagter er usynlige.

---

### Loesning

#### Trin 1: SQL-migrering (en samlet migrering)

**1a) Backfill assignments:** Saet `department_id` paa de 10 orphaned opgaver til "12 - Fredericia" (`8c542620-9156-4155-b686-564b14a4ca62`):

```text
UPDATE assignments
SET department_id = '8c542620-9156-4155-b686-564b14a4ca62'
WHERE department_id IS NULL AND is_demo = false;
```

**1b) Opdater RPC** saa fremtidige NULL-vaerdier ogsaa vises. I begge grene (admin og servicemedarbejder) aendres:

Fra:
```text
WHERE (p_department_id IS NULL OR a.department_id = p_department_id)
  AND (p_sub_department_id IS NULL OR a.sub_department_id = p_sub_department_id)
```

Til:
```text
WHERE (p_department_id IS NULL OR a.department_id = p_department_id OR a.department_id IS NULL)
  AND (p_sub_department_id IS NULL OR a.sub_department_id = p_sub_department_id OR a.sub_department_id IS NULL)
```

**1c) Backfill duties:** Synkroniser de 21 orphaned vagters department_id med deres opretters afdeling:

```text
UPDATE on_call_duties d
SET department_id = p.department_id
FROM profiles p
WHERE d.created_by = p.id
  AND d.department_id IS NULL
  AND d.is_demo = false;
```

#### Trin 2: Fix `useDutyActions.ts` - tilfoej department_id ved oprettelse

Importér `useDepartment` og tilfoej `department_id` og `sub_department_id` til duty-insert objektet (linje 52-59).

#### Trin 3: Fix `useDutyData.ts` - defensiv query

Aendr linje 66-68 fra `.eq('department_id', selectedDepartmentId)` til:

```text
query = query.or(`department_id.eq.${selectedDepartmentId},department_id.is.null`);
```

#### Trin 4: Dokumentation

Opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.

### Kvalitetstjek

- Ingen foelsom data logges
- RLS-politikker uaendrede (kun RPC-logik og client-side query justeret)
- Backfill pavirker kun orphaned records
- Defensiv `OR IS NULL`-logik forebygger fremtidige problemer
- Overholder tekniske specifikationer og UI-guidelines

