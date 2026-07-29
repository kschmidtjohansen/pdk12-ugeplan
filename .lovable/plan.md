# Bil på værksted skal blokere valg i planlægningen

## Problem
Vagtbil 41 (Hillerød) er planlagt til værksted 6/8, men kan stadig vælges når man opretter/redigerer en opgave på den dato. `MultipleCarSelector` filtrerer kun på `car.is_available` (som først bliver `false` på selve startdatoen), og tager ikke højde for `car_unavailability`-perioder.

## Løsning
Læs aktive værkstedsperioder ind i bil-vælgeren og behandl dem som en dato-specifik blokering (samme mønster som eksisterende bookings).

### Ændringer
1. **`src/components/Planner/MultipleCarSelector.tsx`**
   - Hent perioder via `useCarUnavailability()`.
   - Ny helper `isCarInMaintenance(carId, dateStr)` der matcher periode hvor `released_at IS NULL` og `start_date <= dateStr <= end_date`.
   - Udvid `carAvailabilityMap`: en dato hvor bilen er på værksted tælles som konflikt (fuldt blokeret hvis alle valgte datoer rammer værksted → `none`, ellers `partial`).
   - I `handleCarClick`: hvis alle valgte datoer er værksted-blokerede, blokér valg og vis en toast "Bilen er på værksted i perioden {start}–{slut}". Ved delvis konflikt: brug samme confirm-dialog som ved booking-konflikt, men med tydelig værksted-tekst og de berørte datoer.
   - Vis en gul "Værksted"-badge/label + tooltip med periode ved biler der har en aktiv eller kommende periode der overlapper de valgte datoer.

2. **Ingen backend-ændringer** — `car_unavailability` findes allerede, hook er dept-scoped, og eksisterende `is_available`-flip på startdagen bevares.

## Ikke omfattet
- Bulk-tildeling (`BulkAssignCarDialog`) og enkelt-bil felter behandles ikke i denne omgang, medmindre du ønsker det. Sig til hvis de også skal opdateres.

## Verifikation
- Åbn opgave 6/8 i Hillerød → Vagt 41 vises som "Værksted" og kan ikke vælges.
- Opret opgave 5/8–7/8 → delvis konflikt-dialog nævner 6/8 som værksted.
- Frigiv værkstedsperioden → bilen kan straks vælges igen (realtime invalidation findes allerede).
