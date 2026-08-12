# Tydelig fejl ved oprettelse af medarbejder

## Hvad sker der nu

Fejlen på dit billede er ikke en teknisk nedbrud — den skjuler bare den rigtige besked. Serverloggen viser, at oprettelsen fejlede med:

"En bruger med denne email findes allerede i systemet" (e-mailen casper.smedemark@polygongroup.com er allerede registreret).

Serveren sender den præcise danske forklaring tilbage, men klienten læser den ikke: når svaret har en fejlstatus, viser Supabase-klienten kun standardteksten "Edge Function returned a non-2xx status code". Derefter forsøger koden en fallback-oprettelse, som også fejler (den er kun til vikarer), og resultatet bliver den lange røde "Alle oprettelsesmetoder fejlede"-besked.

## Hvad der ændres

1. **Læs serverens rigtige fejlbesked** i oprettelsesflowet: når edge-funktionen svarer med en fejlstatus, hentes svarets indhold og den konkrete besked vises i stedet for den tekniske standardtekst.
2. **Stop unødig fallback**: hvis serveren afviste med en reel årsag (e-mail findes allerede, ugyldigt telefonnummer, manglende rettigheder), forsøges den direkte oprettelse ikke, og fejlen vises direkte og kort.
3. **Kortere, læsbar toast**: én linje med årsagen, f.eks. "E-mailen er allerede registreret — find brugeren under Brugere og tildel afdelingen i stedet", i stedet for den sammenkædede fejlkæde.

## Teknisk

- `src/hooks/employee/useEmployeeCreation.ts`: ved `supabase.functions.invoke`-fejl læses `error.context` (Response) via `await error.context.json()` og feltet `error` bruges som besked. Fejl med HTTP 400/403/409/422 markeres som "endelig" og springer Method 2-fallback over.
- Ingen ændringer i `supabase/functions/admin-create-user/index.ts` — den returnerer allerede korrekt besked og status 409.
- Ingen database- eller sikkerhedsændringer.
- Efter opgaven: opdatér `CHANGELOG.md` jf. projektets rutiner.
