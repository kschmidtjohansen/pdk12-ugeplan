## Mål
Gør valg af underafdeling valgfrit ved oprettelse/redigering af biler.

## Ændringer
**`src/components/Cars/CarFormDialog.tsx`**
- Linje 216–218: Fjern fejlbeskeden "Vælg mindst én underafdeling".
- Linje 230: Fjern `disabled`-betingelsen på submit-knappen, så den ikke længere kræver mindst én underafdeling.

Underafdeling-checkboxene bevares som valgfrit felt. Eksisterende sync-logik i `useCarFormState.ts` håndterer allerede tom liste korrekt (sletter junction-rækker og indsætter intet).

## Dokumentation
- `CHANGELOG.md`: Note om at underafdeling nu er valgfrit ved bil-oprettelse.
- `docs/implementation-plan/tasks.md`: Marker som fuldført.

Ingen DB- eller RLS-ændringer nødvendige.