# Forkert fejlbesked ved oprettelse af medarbejder

## Hvad der faktisk sker

E-mailen sebastian.larsen@polygongroup.com findes **ikke** i systemet — hverken som medarbejder eller som login. Det er bekræftet ved opslag i databasen.

Serverloggen fra dine forsøg kl. 06:41–06:42 i dag viser den rigtige årsag:

"Password is known to be weak and easy to guess" (adgangskoden er fundet i kendte læk af adgangskoder).

Fejlen bliver vist forkert, fordi oprettelsen tolker enhver afvisning af typen 422 som "e-mailen findes allerede". Adgangskode-afvisninger har også koden 422, og derfor kommer den forkerte besked frem.

## Hvad der ændres

1. **Kun rigtige dubletter kaldes dubletter**: "findes allerede"-beskeden vises kun, når serveren reelt melder e-mail-dublet — ikke ved andre afvisninger.
2. **Tydelig besked om adgangskoden**: ved en for svag/lækket adgangskode vises "Adgangskoden er for usikker eller kendt fra datalæk — vælg en anden" på dansk.
3. **Øvrige afvisninger** (ugyldig e-mail, for kort kode m.m.) vises med deres egen forklaring i stedet for en generisk fejl.

Efter rettelsen kan Sebastian oprettes med det samme, hvis der blot vælges en anden adgangskode.

## Teknisk

- `supabase/functions/admin-create-user/index.ts`: dublet-detektionen (`isEmailExists`) fjerner `status === 422` som kriterium og bruger kun `code === 'email_exists'` samt beskedmatch på "already been registered"/"user already registered". Nyt gren for `code === 'weak_password'` → status 422 med dansk besked; andre `AuthApiError` returneres med serverens egen besked oversat til dansk hvor muligt.
- `src/hooks/employee/useEmployeeCreation.ts`: fejlkortlægningen udvides med `weak_password`/"weak" → `employees.passwordRequirements`-lignende tekst; ingen ændring i fallback-logikken (422 er fortsat endelig).
- Nye tekstnøgler i `src/translations/da/employees.ts` og `en/employees.ts` til den svage adgangskode.
- Ingen database- eller sikkerhedsændringer.
- Efter opgaven: opdatér `CHANGELOG.md` og markér i `docs/implementation-plan/tasks.md`.
