

## Fix: Nærmeste-funktionen virker ikke ved redigering

### Rodårsag

Alle opgaver i databasen har `lat = NULL, lng = NULL`. Selvom koden gemmer koordinater ved oprettelse, har **eksisterende opgaver aldrig fået koordinater**. Når man redigerer en opgave, starter `caseLat`/`caseLng` som `undefined`, og der er ingen logik der automatisk henter koordinater fra den eksisterende adresse/postnummer.

Derudover viser den nuværende kode kun afstand som `text-muted-foreground` (grå tekst) for alle inden for 15 km. Brugeren ønsker at de **3 nærmeste** vises med **grøn tekst/status**.

---

### Trin 1: Auto-fetch koordinater i edit-mode

**`src/components/Planner/AssignmentFormFields.tsx`**

Tilføj en `useEffect` der kører når komponenten mountes i edit-mode:
- Hvis `caseLat`/`caseLng` er `undefined` og der findes et `zipCode` eller et postnummer kan udtrækkes fra `location`
- Kald `fetchPostnrCoords(postnummer)` for at hente koordinater
- Opdater `caseLat`, `caseLng` og kald `onCoordsChange`

Dette sikrer at proximity-beregningen fungerer med det samme ved redigering.

---

### Trin 2: Top-3 nærmeste med grøn tekst

**`src/components/Planner/EmployeeSelector.tsx`**

Ændringer i distance-visning:
- Beregn hvilke medarbejdere der er de 3 nærmeste (inden for 15 km radius)
- De 3 nærmeste vises med **grøn tekst** (`text-green-600`) og MapPin-ikon i grøn
- Øvrige inden for 15 km vises stadig med afstand, men i standard `text-muted-foreground`
- Medarbejdere over 15 km eller uden koordinater: ingen afstandsvisning

---

### Trin 3: Dokumentation

**`CHANGELOG.md`**: Dokumenter fix af edit-mode koordinater og grøn top-3 visning.

---

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Planner/AssignmentFormFields.tsx` | useEffect til auto-fetch koordinater fra postnummer i edit-mode |
| `src/components/Planner/EmployeeSelector.tsx` | Top-3 nærmeste med grøn tekst, øvrige i grå |
| `CHANGELOG.md` | Dokumenter ændringerne |

### Tekniske detaljer

**Auto-fetch logik (AssignmentFormFields)**:
```text
useEffect(() => {
  if (caseLat == null && caseLng == null) {
    const postcode = zipCode || extractPostcode(location);
    if (postcode) {
      fetchPostnrCoords(postcode).then(coords => {
        if (coords) {
          setCaseLat(coords.lat);
          setCaseLng(coords.lng);
          onCoordsChange?.(coords.lat, coords.lng);
        }
      });
    }
  }
}, []);  // Kører kun ved mount
```

**Top-3 grøn logik (EmployeeSelector)**:
```text
// Find de 3 nærmeste inden for 15 km
const nearbyIds = sortedEmployees
  .filter(emp => distanceMap.get(emp.id) != null && distanceMap.get(emp.id) <= 15)
  .slice(0, 3)
  .map(emp => emp.id);

// Brug grøn tekst for top-3:
const isTop3 = nearbyIds.includes(employee.id);
// className: isTop3 ? "text-green-600" : "text-muted-foreground"
```

### Kvalitetstjek

- Auto-fetch kører kun ved mount og kun hvis koordinater mangler (idempotent)
- Grøn visning er begrænset til top 3 inden for 15 km — ikke alle
- Fallback til grå tekst for øvrige medarbejdere med afstand
- Ingen ændring af sorteringslogik (stadig 15 km radius øverst)
- Overholder UI guidelines: semantiske farver, ingen hardcoded grays
