

## Opgave: 15 km Radius-logik i medarbejder-booking

### Oversigt

Erstat den nuvaerende postnummer-baserede naerhedssortering (3 niveauer: eksakt/regional/anden) med praecis GPS-afstandsberegning via Haversine-formlen. Medarbejdere inden for 15 km vises oeverst med groen label og praecis afstand.

---

### Trin 1: Opret Haversine-utility

**Ny fil: `src/utils/haversine.ts`**

```text
export function haversineDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

Ren funktion, ingen side-effekter, lynhurtig beregning.

---

### Trin 2: Udvid EmployeeSelector med GPS-koordinater

**`src/components/Planner/EmployeeSelector.tsx`**

Aendringer i interface:
- Tilfoej `caseLat?: number` og `caseLng?: number` props

Erstat `getProximityLevel` og `sortedEmployees` logik:
- Beregn afstand via `haversineDistanceKm` for hver medarbejder der har `lat` og `lng`
- Gem afstande i et `Map<string, number>` via `useMemo`
- Sorter: medarbejdere med afstand under eller lig 15 km foerst (sorteret efter afstand), derefter resten alfabetisk
- Fallback: hvis opgaven mangler koordinater, sorter alfabetisk

Erstat badge-rendering (linje 219-233):
- Hvis afstand er tilgaengelig og under eller lig 15 km: groen badge med MapPin-ikon og tekst "Naermeste (X,X km)"
- Hvis afstand er tilgaengelig og over 15 km: ingen naerheds-badge (vises som normal)
- Hvis medarbejder mangler koordinater: ingen badge

---

### Trin 3: Send koordinater fra AssignmentFormFields

**`src/components/Planner/AssignmentFormFields.tsx`**

- Tilfoej state: `caseLat` og `caseLng` (synkroniseret med `onCoordsChange`)
- Send `caseLat` og `caseLng` som props til `EmployeeSelector`
- Opdater `onCoordsChange`-kaldene til ogsaa at gemme lokalt i component state

---

### Trin 4: Opdater oversaettelser

**`src/translations/da/planner.ts`**:
- Tilfoej: `proximityNear: 'Naermeste'`
- Tilfoej: `proximityDistance: '{distance} km vaek'`

**`src/translations/en/planner.ts`**:
- Tilfoej: `proximityNear: 'Nearest'`
- Tilfoej: `proximityDistance: '{distance} km away'`

---

### Trin 5: Dokumentation

**`docs/implementation-plan/tasks.md`**:
- Tilfoej ny fase "15km Radius Optimering" markeret som faerdig

**`CHANGELOG.md`**:
- Dokumenter Haversine-implementering og 15 km radius-logik

---

### Tekniske detaljer

**Sorteringslogik (pseudokode)**:
```text
distances = employees.map(emp => {
  if (emp.lat && emp.lng && caseLat && caseLng)
    return haversineDistanceKm(caseLat, caseLng, emp.lat, emp.lng)
  return null
})

sorted = employees.sort((a, b) => {
  distA = distances[a.id]
  distB = distances[b.id]
  
  // Begge inden for 15 km: sorter efter afstand
  if (distA <= 15 && distB <= 15) return distA - distB
  // Kun A inden for: A foerst
  if (distA <= 15) return -1
  // Kun B inden for: B foerst
  if (distB <= 15) return 1
  // Begge udenfor eller uden data: alfabetisk
  return a.name.localeCompare(b.name)
})
```

**Badge-visning**:
```text
Inden for 15 km:
  [MapPin] Naermeste (8,4 km vaek)
  Groen badge: bg-green-100 text-green-700 border-green-300

Over 15 km eller ingen data:
  Ingen naerheds-badge
```

**Afstandsformatering**: Brug dansk komma-separator (`distance.toFixed(1).replace('.', ',')`) naar `currentLanguage === 'da'`.

---

### Filer der aendres/oprettes

| Fil | Aendring |
|-----|----------|
| `src/utils/haversine.ts` | Ny fil: Haversine-formel |
| `src/components/Planner/EmployeeSelector.tsx` | GPS-baseret sortering og badges |
| `src/components/Planner/AssignmentFormFields.tsx` | Send caseLat/caseLng til EmployeeSelector |
| `src/translations/da/planner.ts` | Nye naerheds-oversaettelser |
| `src/translations/en/planner.ts` | Nye naerheds-oversaettelser |
| `docs/implementation-plan/tasks.md` | Marker 15km som faerdig |
| `CHANGELOG.md` | Dokumenter aendringen |

### Kvalitetstjek

- Haversine er ren matematik — ingen API-kald, ingen latency
- Fallback til alfabetisk sortering hvis koordinater mangler
- Dansk komma-formatering af afstand
- Eksisterende postcode-props beholdes for backward compatibility men bruges ikke laengere til sortering
- Ingen foelsom data eksponeres (koordinater er offentlige postnummer-data)
