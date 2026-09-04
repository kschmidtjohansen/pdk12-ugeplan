# Dubleret "kommer"-sag i Hillerød

## Diagnose (bekræftet via database-forespørgsel)

Dubletten skyldes ikke koden — der ligger **tre identiske rækker** i `assignments` for den 4. september 2026 (Tammosevej 22, 08:00–16:00, samme sagsansvarlige), oprettet inden for ca. 5 minutter den 28. august kl. 06:45–06:50. Det tyder på, at sagen blev oprettet flere gange i træk (gentagne gem-klik).

| ID (forkortet) | Oprettet | department_id |
|---|---|---|
| 6005ddf3… | 04:45:02 | **NULL** |
| e16a7608… | 04:48:37 | **NULL** |
| 2e5ab798… | 04:50:16 | ca52e77e… (korrekt) |

To af rækkerne mangler desuden `department_id`, hvilket bryder afdelings-isolationen.

## Plan

1. **Oprydning i databasen**
   - Tjek `assignments_employees` (og evt. `planner_change_log`) for henvisninger til de to fejlagtige rækker og flyt/slet tilknytninger.
   - Slet rækkerne `6005ddf3…` og `e16a7608…` (dem uden `department_id`).
   - Behold `2e5ab798…` (den korrekte med afdelingstilknytning).

2. **Forebyggelse af fremtidige dubletter**
   - I `AssignmentForm.tsx`: deaktivér Gem-knappen mens oprettelsen kører (loading-state), så dobbeltklik ikke opretter flere sager.

3. **Kvalitetstjek**
   - Verificér bagefter at der kun findes én "kommer"-sag pr. dato, og at dashboard/mobilvisning kun viser den én gang.
   - Opdater `CHANGELOG.md`.

## Tekniske detaljer

- Berørte rækker: `6005ddf3-3489-4aae-b95f-dc70ef55c9c0`, `e16a7608-664a-4811-a9bb-b26392359d0a`
- Sagen den 3. september ("udkald") og serien 9.–11. september (Østre Paradisvej) er forskellige sager og røres ikke.
