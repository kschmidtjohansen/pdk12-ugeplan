# Fejl ved kodeskift og sletning af medarbejder

## Årsag (bekræftet)

Begge handlinger går gennem serverfunktioner, der slår brugerens rolle op med et opslag, som kun tillader **én** rolle pr. bruger. Databasen indeholder 19+ brugere med flere roller (din egen konto har 4: administrator, skadeleder, super_admin, fugttekniker), så opslaget fejler, og funktionen svarer "manglende rettigheder" i stedet for at udføre handlingen.

Det er præcis samme fejltype, som tidligere blev rettet i opret-medarbejder-funktionen — de to øvrige funktioner blev ikke opdateret dengang.

Berørte funktioner:
- `admin-reset-password` (rediger kode)
- `admin-user-delete` (slet medarbejder)

## Ændringer

1. **Rollekontrol med flere roller**
   - Hent alle rollerækker for brugeren i stedet for at kræve præcis én.
   - Giv adgang, hvis rollelisten indeholder `administrator` eller `super_admin`.
   - Ingen udvidelse af rettigheder — kun korrekt håndtering af flere roller.

2. **Tydelige fejlbeskeder**
   - Serverens faktiske fejlbesked vises i toasten ved sletning og kodeskift, i stedet for en generisk teknisk fejl (samme mønster som ved oprettelse).

3. **Verificering af sletning**
   - Efter rettelsen testes en sletning. Hvis sletningen fejler på databaserelationer (opgaver, vagter, filer m.m. der peger på brugeren), tilføjes en oprydning i funktionen, så brugerens tilknytninger fjernes før selve sletningen — og der gives en klar besked, hvis noget ikke kan slettes.

## Teknisk

- `supabase/functions/admin-reset-password/index.ts`: `.select('role').eq('user_id', ...).single()` → hent alle rækker uden `.single()`, tjek `roles.some(r => ['administrator','super_admin'].includes(r))`.
- `supabase/functions/admin-user-delete/index.ts`: samme rettelse.
- `src/hooks/employee/useEmployeeActions.ts`: udtræk servermeddelelse fra `FunctionsHttpError`-svaret ved sletning.
- Ingen database-migration eller RLS-ændring.
- `CHANGELOG.md` opdateres jf. dokumentationsreglerne.
