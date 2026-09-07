# Notifikation ved sygemelding

Når en administrator markerer en medarbejder som syg for en dag, får alle administratorer og skadeledere i samme afdeling en notifikation i klokke-menuen.

## Sådan virker det

- Notifikationen sendes automatisk i det øjeblik markeringen gemmes — også hvis den sker fra en anden enhed.
- Modtagere: administratorer, super admins og skadeledere med adgang til den pågældende afdeling. Den der selv markerer, får ikke besked.
- Tekst: titel "Sygemelding" og besked som "Anna Hansen er meldt syg mandag den 7. september". Klik fører til medarbejdersiden.
- Fjerner man markeringen igen, sendes ingen ny besked, og den gamle notifikation bliver stående (kan slettes som andre notifikationer).
- Der sendes kun én besked pr. medarbejder pr. dag, så gentagne markeringer ikke spammer.
- Servicemedarbejdere og vikarer får ingen besked og kan ikke se årsagen nogen steder — uændret i forhold til i dag.

## Teknisk

**Database (migration)**
- Ny funktion `public.notify_sick_day()` — `SECURITY DEFINER`, `SET search_path = ''`, samme mønster som `notify_admins_of_pending_user`.
  - Slår medarbejderens navn op i `public.profiles`.
  - Finder modtagere: `user_id` fra `public.user_roles` med rolle `administrator`, `super_admin` eller `skadeleder`, som enten har en række i `public.user_access` for `NEW.department_id` eller har `profiles.home_department_id = NEW.department_id`. `super_admin` uden afdelingstilknytning medtages også.
  - Udelader `NEW.created_by`.
  - Springer over, hvis der allerede findes en `notifications`-række af typen `sick_day` for samme modtager, medarbejder og dato (dedup via `link`/`message`-match, som i den eksisterende funktion).
  - Indsætter i `public.notifications` med `type = 'sick_day'`, `link = '/employees'`.
- Ny trigger `AFTER INSERT ON public.sick_days FOR EACH ROW EXECUTE FUNCTION public.notify_sick_day()`.
- `REVOKE EXECUTE` på funktionen fra `anon` og `authenticated` (den kaldes kun af triggeren).

**Frontend**
- `src/utils/notifications.ts`: `getNotificationIcon` udvides med `sick_day` → `thermometer` (eller nærmeste eksisterende ikon).
- Oversættelser tilføjes i `src/translations/da/notifications.ts` og `en/notifications.ts` (`sickDayTitle`, `sickDayMessage`) til visning, hvor titler oversættes; selve teksten skrives dansk fra databasen som ved de øvrige trigger-notifikationer.
- Ingen ændring i `EmployeesPage` — indsættelsen i `sick_days` udløser triggeren selv.
- `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres.
