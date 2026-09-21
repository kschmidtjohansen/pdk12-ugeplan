# Fejl ved oprettelse af vikar: "Adgangskoden er for usikker"

## Hvad der faktisk sker

Vikarer bliver ikke bedt om en adgangskode — det er korrekt. Men bag kulissen oprettes der stadig en loginkonto, og serveren laver selv en tilfældig adgangskode til den.

Serverloggen fra dine forsøg i morges (Anders Axelsen, rolle vikar) viser den præcise årsag:

"Password should contain at least one character of each: lowercase, uppercase, digits."

Den automatisk genererede kode består kun af små bogstaver og tal-tegn, så den lever ikke op til projektets krav om både store bogstaver, små bogstaver og cifre. Oprettelsen afvises derfor, og fejlen vises som om *du* havde valgt en dårlig adgangskode.

## Hvad der ændres

1. **Vikarer får en korrekt genereret kode automatisk**: den tilfældige kode, systemet selv laver, indeholder fremover altid store bogstaver, små bogstaver, cifre og specialtegn, så den godkendes. Du skal stadig ikke indtaste noget.
2. **Fejlbeskeden om svag adgangskode vises kun, når en adgangskode rent faktisk er indtastet manuelt** — ved vikarer uden kode vises i stedet en neutral besked, hvis noget går galt.

Efter rettelsen kan vikarer oprettes uden at indtaste en adgangskode.

## Teknisk

- `supabase/functions/admin-create-user/index.ts`: erstat `crypto.randomUUID()` som adgangskode for midlertidige brugere med en hjælpefunktion `generateStrongPassword()` (fx 24 tegn sammensat af mindst ét tegn fra hver af grupperne A-Z, a-z, 0-9 og specialtegn, resten fra `crypto.getRandomValues`, blandet tilfældigt).
- Samme sted: i fejlhåndteringen gøres `weak_password`-grenen betinget af, at kaldet indeholdt en klientleveret adgangskode (`!isTemporary`); for midlertidige brugere returneres i stedet en generisk besked med serverens kode i loggen, så en systemfejl aldrig fremstår som brugerens valg.
- Ingen ændringer i frontend, database, RLS eller rettigheder.
- Efter opgaven: opdatér `CHANGELOG.md` og markér punktet i `docs/implementation-plan/tasks.md`.
