

## Opgave: GPS-koordinater til profiles og assignments

### Oversigt

Tilfoej `lat` og `lng` kolonner til `profiles` og `assignments` tabellerne, og implementer automatisk koordinat-hentning fra DAWA API naar et postnummer gemmes paa en medarbejder.

---

### Trin 1: Database-migrering

Opret en ny migration der tilfojer kolonnerne:

```sql
-- profiles: GPS for medarbejderens hjemmepostnummer
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lat float8;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lng float8;

-- assignments: GPS for opgavens lokation
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS lat float8;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS lng float8;
```

Ingen index nødvendigt endnu (bruges til klient-side sortering, ikke DB-queries).

---

### Trin 2: Udvid dawa-proxy Edge Function

Tilfoej en ny rute til `supabase/functions/dawa-proxy/index.ts` der haandterer postnummer-opslag:

- Hvis query-parameter `postnr` er sat (f.eks. `?postnr=7120`), kald `https://api.dataforsyningen.dk/postnumre/{postnr}`
- Returner hele DAWA-svaret (inkl. `visueltcenter` med `[lng, lat]`)
- Eksisterende `?q=` autocomplete-logik forbliver uaendret

---

### Trin 3: Hook til koordinat-hentning

Opret `src/hooks/useDawaPostnrLookup.ts`:

- Eksporter en funktion `fetchPostnrCoords(postnr: string): Promise<{lat: number, lng: number} | null>`
- Kalder dawa-proxy med `?postnr={postnr}`
- Udtraekker `visueltcenter` fra svaret (`[lng, lat]` — DAWA returnerer longitude foerst)
- Returnerer `{ lat, lng }` eller `null` ved fejl

---

### Trin 4: Integrer i medarbejder-gem (profiles)

**`src/hooks/employee/useEmployeeActions.ts`** (updateEmployee):
- Naar `home_postcode` aendres, kald `fetchPostnrCoords(home_postcode)`
- Tilfoej `lat` og `lng` til updatePayload

**`src/hooks/employee/useEmployeeCreation.ts`** (createEmployee):
- Samme logik: hent koordinater fra DAWA foer profile insert/update
- Tilfoej `lat` og `lng` til profile-data

**`supabase/functions/admin-create-user/index.ts`**:
- Tilfoej `home_postcode`, `home_address`, `lat`, `lng` til profile insert (linje 215-229)
- Koordinat-hentning sker paa klient-siden, edge function gemmer blot vaerdierne

---

### Trin 5: Integrer i opgave-gem (assignments)

**`src/components/Planner/AssignmentFormFields.tsx`**:
- Naar DAWA-adresse vaelges og postnummer udtraekkes, kald ogsaa `fetchPostnrCoords`
- Send `lat`/`lng` videre via nye props (eller tilfoej til formData)

**`src/hooks/assignment/useAssignmentActions.ts`**:
- Tilfoej `lat` og `lng` til insert/update payloads (linje 112-126 og 288-300)

---

### Trin 6: Opdater TypeScript-typer

**`src/types/employee.ts`**:
- Tilfoej `lat?: number` og `lng?: number` til Employee-interface

**`src/types/assignment.ts`**:
- Tilfoej `lat?: number` og `lng?: number` til Assignment-interface

---

### Trin 7: Opdater data-fetching

**`src/hooks/employee/useEmployeeData.ts`**:
- Tilfoej `lat` og `lng` til SELECT-query (linje 73-76)
- Tilfoej til transformedEmployees mapping

---

### Trin 8: Dokumentation

**`docs/technical-specs/database-schema.md`**:
- Tilfoej nyt afsnit "GPS-koordinater" med beskrivelse af `lat`/`lng` kolonner paa baade `profiles` og `assignments`
- Dokumenter DAWA-integration og `visueltcenter`-feltet

**`CHANGELOG.md`**:
- Dokumenter de nye kolonner og automatisk koordinat-hentning

---

### Filer der aendres/oprettes

| Fil | Aendring |
|-----|----------|
| `supabase/migrations/[timestamp]_add_gps_coordinates.sql` | Ny migration |
| `supabase/functions/dawa-proxy/index.ts` | Tilfoej `?postnr=` rute |
| `src/hooks/useDawaPostnrLookup.ts` | Ny hook (koordinat-hentning) |
| `src/types/employee.ts` | Tilfoej lat/lng |
| `src/types/assignment.ts` | Tilfoej lat/lng |
| `src/hooks/employee/useEmployeeActions.ts` | Koordinater ved update |
| `src/hooks/employee/useEmployeeCreation.ts` | Koordinater ved create |
| `src/hooks/employee/useEmployeeData.ts` | Hent lat/lng fra DB |
| `src/hooks/assignment/useAssignmentActions.ts` | Gem lat/lng paa opgaver |
| `src/components/Planner/AssignmentFormFields.tsx` | Hent koordinater ved adresse-valg |
| `supabase/functions/admin-create-user/index.ts` | Gem home_postcode + lat/lng |
| `docs/technical-specs/database-schema.md` | Dokumenter GPS-kolonner |
| `CHANGELOG.md` | Log aendringerne |

### Kvalitetstjek

- Ingen foelsom data logges (koordinater er offentlige postnummer-data)
- Fallback: hvis DAWA fejler, gemmes lat/lng som NULL — ingen blokering af gem-flow
- Eksisterende RLS-politikker daekker de nye kolonner automatisk
- Backward compatible: alle nye kolonner er nullable

