Plan:

1. Dashboard fraværende metric
- Gennemgå hvorfor Henrik ikke ender i `absentEmployees` selvom `trainingIds` findes.
- Sikre at dashboard-metrics bruger samme dato og afdeling som den synlige KPI.
- Sikre at medarbejdere på kursus altid lægges i `absentEmployees` med `onTraining` og kursusinfo, også hvis normal availability-status ellers er “available”.

2. Fraværende-dialog på dashboard
- Vise Henrik i listen når han er på kursus.
- Vise gul `Kursus` label ved medarbejderen.
- Beholde eksisterende ferie/fravær labels for andre medarbejdere.

3. Ikke-tildelte ressourcer i Planner
- Udvide `UnassignedResourcesSection`, så medarbejdere på kursus ikke kun fjernes fra “tilgængelige”, men også vises i fraværende-sektionen med gul `Kursus` label.
- Sørge for at tælleren for fraværende inkluderer både ferie, fravær og kursus.

4. Tekstændring
- Ændre teksten “Medarbejdere på ferie” til “Medarbejdere fraværende” i Ikke-tildelte Ressourcer.
- Opdatere relevant dansk translation-key/visning uden at ændre unødige tekster andre steder.

5. Dokumentation og kontrol
- Opdatere `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.
- Kontrollere at ændringen følger eksisterende UI-patterns og ikke påvirker multi-tenant/afdelingsisolering.