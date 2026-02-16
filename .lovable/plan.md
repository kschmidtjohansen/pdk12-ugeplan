

## Fix: Nærmeste-funktionen virker ikke

### Rodårsag

Der er **to problemer**:

1. **Ingen medarbejdere har GPS-koordinater i databasen.** Alle 10+ medarbejdere med `home_postcode` har `lat = NULL, lng = NULL`. Koordinat-hentning blev kun tilfojet til create/update-flows, men eksisterende data blev aldrig backfilled.

2. **Edit-mode initialiserer ikke koordinater.** Naar man redigerer en eksisterende opgave, starter `caseLat`/`caseLng` som `undefined` i AssignmentFormFields, selvom opgaven allerede har koordinater i `formData`.

---

### Trin 1: Backfill eksisterende medarbejderes koordinater

Opret en **one-time backfill-funktion** der koerer ved app-start (eller manuelt):

**Ny fil: `src/utils/backfillEmployeeCoords.ts`**
- Hent alle profiles med `home_postcode IS NOT NULL AND lat IS NULL`
- For hver: kald `fetchPostnrCoords(home_postcode)`
- Opdater `lat` og `lng` i profiles-tabellen
- Kald funktionen een gang fra en admin-komponent eller som en useEffect i app-init

Alternativt (mere elegant): Tilfoej logik i `useEmployeeData.ts` der efter fetch tjekker om nogen medarbejdere mangler koordinater og backfiller dem i baggrunden.

### Trin 2: Backfill i useEmployeeData

**`src/hooks/employee/useEmployeeData.ts`**:
- Efter employees er hentet, find dem der har `home_postcode` men mangler `lat`/`lng`
- Kald `fetchPostnrCoords` for hver og opdater via Supabase
- Koer kun een gang (brug en ref til at tracke)

### Trin 3: Initialiser caseLat/caseLng i edit-mode

**`src/components/Planner/AssignmentFormFields.tsx`**:
- Tilfoej nye props: `initialLat?: number` og `initialLng?: number`
- Brug dem til at initialisere `caseLat`/`caseLng` state

**`src/components/Planner/AssignmentForm.tsx`**:
- Send `formData.lat` og `formData.lng` videre som `initialLat`/`initialLng` props til AssignmentFormFields

### Trin 4: Dokumentation

**`CHANGELOG.md`**: Dokumenter backfill og edit-mode fix

---

### Filer der aendres/oprettes

| Fil | Aendring |
|-----|----------|
| `src/hooks/employee/useEmployeeData.ts` | Backfill koordinater for eksisterende medarbejdere |
| `src/components/Planner/AssignmentFormFields.tsx` | Tilfoej initialLat/initialLng props |
| `src/components/Planner/AssignmentForm.tsx` | Send lat/lng fra formData til AssignmentFormFields |
| `CHANGELOG.md` | Dokumenter fixes |

### Kvalitetstjek

- Backfill koerer kun for medarbejdere med postcode men uden koordinater (idempotent)
- Ingen blokering af UI — backfill sker asynkront i baggrunden
- Edit-mode faar korrekte koordinater med det samme
- Fallback: hvis DAWA fejler, forbliver lat/lng NULL — ingen crash
