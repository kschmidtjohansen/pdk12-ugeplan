
## Opgave: Brug DAWA-koordinater direkte fra autocomplete-svar

### Nuvaerende situation

Flowet er i dag:
1. Bruger vaelger adresse fra DAWA autocomplete
2. Postnummer udtraekkes
3. Et **separat** API-kald til `fetchPostnrCoords` henter koordinater fra DAWA postnummer-endpoint
4. Koordinater gemmes via `onCoordsChange` og sendes til databasen

Problemet: DAWA autocomplete-API'et returnerer allerede koordinater i `adresse.adgangspunkt.koordinater` (format: `[lng, lat]`), men disse ignoreres. Det separate API-kald er unodvendigt.

### Loesning

Udtraek koordinaterne direkte fra DAWA autocomplete-svaret og videregiv dem til formularen. Fjern det overflodige `fetchPostnrCoords`-kald ved adresse-valg.

---

### Trin 1: Udvid DawaSuggestion-typen

**`src/hooks/useDawaAutocomplete.ts`**:
- Tilfoej `adgangspunkt` med `koordinater: [number, number]` til `adresse`-interfacet
- DAWA returnerer allerede disse data — vi skal bare tilfoeje typen

### Trin 2: Udvid AddressAutocomplete callback

**`src/components/Planner/AddressAutocomplete.tsx`**:
- Udvid `onAddressSelect` callback til ogsaa at inkludere `lat` og `lng`
- I `handleSelect`: udtraek koordinater fra `suggestion.adresse.adgangspunkt.koordinater` (swap `[lng, lat]` til `{ lat, lng }`)
- Fallback: hvis koordinater mangler, send `undefined`

### Trin 3: Brug koordinater direkte i AssignmentFormFields

**`src/components/Planner/AssignmentFormFields.tsx`**:
- I `onAddressSelect`-handleren: brug de modtagne `lat`/`lng` direkte via `onCoordsChange`
- Fjern `fetchPostnrCoords`-kaldet ved adresse-valg (det er nu overflodigt)
- Behold `fetchPostnrCoords` som fallback kun for manuelt indtastede adresser (hvor DAWA-koordinater ikke er tilgaengelige)

### Trin 4: Dokumentation

**`CHANGELOG.md`**: Log optimeringen

---

### Tekniske detaljer

**DawaSuggestion type (foer)**:
```text
adresse: {
  vejnavn: string;
  husnr: string;
  postnr: string;
  postnrnavn: string;
}
```

**DawaSuggestion type (efter)**:
```text
adresse: {
  vejnavn: string;
  husnr: string;
  postnr: string;
  postnrnavn: string;
  adgangspunkt?: {
    koordinater: [number, number]; // [lng, lat]
  };
}
```

**AddressAutocomplete onAddressSelect (foer)**:
```text
onAddressSelect({ address, zipCode, city })
```

**AddressAutocomplete onAddressSelect (efter)**:
```text
onAddressSelect({ address, zipCode, city, lat, lng })
```

---

### Filer der aendres

| Fil | Aendring |
|-----|----------|
| `src/hooks/useDawaAutocomplete.ts` | Udvid DawaSuggestion med adgangspunkt.koordinater |
| `src/components/Planner/AddressAutocomplete.tsx` | Udtraek og videregiv koordinater |
| `src/components/Planner/AssignmentFormFields.tsx` | Brug direkte koordinater, fjern overflodigt API-kald |
| `CHANGELOG.md` | Dokumenter aendringen |

### Kvalitetstjek

- Ingen ekstra API-kald ved adresse-valg (koordinater kommer direkte fra autocomplete)
- Fallback via `fetchPostnrCoords` beholdes for manuelt input
- Ingen database-aendringer (lat/lng kolonner eksisterer allerede)
- Backward compatible: alle felter er optional
