# Plan: Slå fraværssektioner sammen i "Ikke tildelte ressourcer"

## Mål
Syge medarbejdere skal ikke vises i et separat felt ("Fraværende medarbejdere"), men smeltes ind i den eksisterende "Medarbejdere fraværende"-liste sammen med ferie/orlov — med én overskrift og ét samlet tal. Årsagen (sygdom) fremgår ikke nogen steder i visningen.

## Ændringer

### `src/components/Planner/UnassignedResourcesSection.tsx`
- Fjern den separate sektion for syge medarbejdere (`employeesSick`-blokken med egen overskrift).
- Byg én samlet fraværsliste: medarbejdere på ferie/orlov + syge medarbejdere for den valgte dag (uden dubletter, hvis en medarbejder både har ferie og sygemelding).
- Overskriften "Medarbejdere fraværende" tæller det samlede antal.
- Alle badges i listen bruger samme neutrale udseende; tooltip viser medarbejderens navn og for syge blot den neutrale tekst "Fraværende denne dag" — aldrig "Syg".
- Oprydning: `employeesSick`-memoen fjernes, hvis den ikke længere bruges.

### Dokumentation (jf. projektets faste rutiner)
- `CHANGELOG.md`: ny sektion for ændringen.
- `docs/implementation-plan/tasks.md`: opgaven markeres fuldført.

## Tekniske detaljer
- Ingen databaseændringer — `sick_days` og rollestyringen (kun admins/skadeledere kan se årsagen på medarbejdersiden) er uændrede.
- Kørsel af `npx tsgo --noEmit -p tsconfig.json` for typecheck.
- Visningen følger fortsat UI-guidelines (kompakt visning, responsive, fungerer i alle planner-visninger).
