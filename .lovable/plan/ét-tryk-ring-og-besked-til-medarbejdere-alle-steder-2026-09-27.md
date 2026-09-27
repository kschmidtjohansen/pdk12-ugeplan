# Ét-tryk ring og besked til medarbejdere alle steder

## Mål
Overalt hvor en medarbejder vises med navn og status, skal der være to små knapper: **Ring** (åbner telefonen) og **SMS** (åbner besked-appen). Kun ét tryk — ingen menuer først. Knapperne vises kun, hvis medarbejderen har et telefonnummer.

## De tre steder

1. **Fuld medarbejderliste (forsiden)** — `EmployeeAvailabilityDialog/EmployeeListItem.tsx`
   - I dag: kun navn + status-mærke. Tilføj Ring/SMS-knapper til højre for mærket.
   - Telefonnummeret hentes med fra start (Employee-typen har allerede `phone`-feltet; sikr at dialogens datakilde udvælger det).

2. **Planlæggeren** — medarbejderrækkerne i planlægningsgitteret (`PlannerContent`/`CompactDaySection` m.fl., hvor `employee.name` vises)
   - Små diskrete ikon-knapper ved siden af navnet, så gitterets tætte layout bevares.
   - På små skærme vises knapperne kun i den udvidede visning, så rækkehøjden ikke vokser.

3. **Ferie/fravær-siden** — `VacationTable.tsx` (og `VacationGridOverview.tsx` ved behov)
   - Ring/SMS ved siden af medarbejderens navn i tabellen.
   - Profil-joinet udvides med `phone`, hvis det ikke allerede hentes.

## Teknisk

- Ny delt komponent `src/components/Shared/EmployeeContactActions.tsx`:
  - Props: `phone?: string | null`, `name?: string`, `size?: 'sm' | 'default'`.
  - To knapper: `<a href="tel:...">` (Phone-ikon) og `<a href="sms:...">` (MessageSquare-ikon), `min-h-11 min-w-11` touch-targets på mobil, `variant="ghost"` for at holde visuel ro.
  - Normaliserer nummeret (fjern mellemrum) som i `StatusPanels.tsx`'s eksisterende `tel()`-hjælper.
  - Returnerer `null` uden nummer. `stopPropagation` på klik, så række-klik ikke udløses.
- Genbruger mønsteret fra `StatusPanels.tsx` (Ring/SMS-knapperne i vagt-panelet).
- Ingen database-ændringer — `profiles.phone` findes og er allerede tilgængelig via eksisterende RLS.
- Rensning: fjern den ubeskyttede `console.log` med dialog-debuginfo i `EmployeeAvailabilityDialog/index.tsx` (linje 46) jf. produktionsreglerne.
- Opdater `CHANGELOG.md` efterfølgende.

## Verifikation
- `bunx tsgo --noEmit -p tsconfig.app.json` skal være ren.
- Visuel kontrol af de tre visninger på mobil-bredde: knapperne er synlige, 44 px, og åbner tel:/sms:-links.
