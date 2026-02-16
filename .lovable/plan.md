

## DAWA Adresse-Autocomplete i Opgave-modulet

### Oversigt

Implementer smart adresse-indtastning i Planner-formularen ved hjaelp af det aabne danske DAWA API (`api.dataforsyningen.dk/adresser/autocomplete`). Naar brugeren taster en adresse, vises forslag i en dropdown. Ved valg udfyldes adresse, postnummer og by automatisk.

---

### Trin 1: Database-migrering

Tilfoej to nye kolonner til `assignments`-tabellen:

```text
ALTER TABLE assignments ADD COLUMN zip_code text;
ALTER TABLE assignments ADD COLUMN city text;
```

---

### Trin 2: TypeScript-type

**`src/types/assignment.ts`**: Tilfoej til `Assignment` interface:

```text
zip_code?: string;
city?: string;
```

---

### Trin 3: Custom hook - useDawaAutocomplete

Opret **`src/hooks/useDawaAutocomplete.ts`**:

- Accepterer en soege-streng (debounced 300ms)
- Kalder `https://api.dataforsyningen.dk/adresser/autocomplete?q={query}&per_side=5`
- Returnerer `{ suggestions, isLoading, error }`
- Hver suggestion indeholder: `tekst`, `adresse.vejnavn`, `adresse.husnr`, `adresse.postnr`, `adresse.postnrnavn`
- Ved API-fejl returneres tom liste (fallback til manuel indtastning)

---

### Trin 4: Autocomplete-komponent

Opret **`src/components/Planner/AddressAutocomplete.tsx`**:

- Input-felt med samme styling som eksisterende Input-komponent
- Popover/dropdown der viser DAWA-forslag under feltet
- Props:
  - `value: string` (location)
  - `onChange: (location: string) => void`
  - `onAddressSelect: (data: { address: string; zipCode: string; city: string }) => void`
  - `placeholder: string`
- Ved valg fra listen:
  - `address` = `vejnavn husnr` -> saettes i location-feltet
  - `zipCode` = `postnr` -> opdaterer casePostcode state + formData
  - `city` = `postnrnavn` -> gemmes i formData
- Ved manuel indtastning (ingen valg fra listen) fungerer feltet som normalt fritekst-felt

---

### Trin 5: Opdater AssignmentFormFields

**`src/components/Planner/AssignmentFormFields.tsx`**:

- Tilfoej nye props: `zipCode`, `setZipCode`, `city`, `setCity`
- Erstat det eksisterende grid med postnummer + adresse-input (linje 154-172) med:
  - Postnummer-felt (120px, read-only naar udfyldt via DAWA, redigerbart manuelt)
  - AddressAutocomplete-komponent (1fr)
- Naar en DAWA-adresse vaelges: postnummer udfyldes automatisk, casePostcode opdateres (til naerheds-sortering)
- By-feltet gemmes i formData men vises ikke som separat felt

---

### Trin 6: Opdater AssignmentForm

**`src/components/Planner/AssignmentForm.tsx`**:

- Tilfoej `zip_code` og `city` til formData-haandtering
- Videregiv `zipCode`, `setZipCode`, `city`, `setCity` til AssignmentFormFields
- Opdater `setLocation`-callback til ogsaa at haandtere zip_code/city

---

### Trin 7: Opdater data-persistering

**`src/hooks/assignment/useAssignmentActions.ts`**:

- Tilfoej `zip_code` og `city` til INSERT (linje 112-124)
- Tilfoej `zip_code` og `city` til UPDATE (linje 286-297)

---

### Trin 8: Opdater data-hentning

Sikkerstil at `zip_code` og `city` mappes korrekt naar assignments hentes fra databasen. Opdater relevante SELECT-queries og data-transforms.

---

### Trin 9: Oversaettelser

**Dansk** (`src/translations/da/planner.ts`):
- `addressSearch: 'Soeg adresse...'`
- `addressNotFound: 'Adresse ikke fundet - indtast manuelt'`
- `cityLabel: 'By'`

**Engelsk** (`src/translations/en/planner.ts`):
- `addressSearch: 'Search address...'`
- `addressNotFound: 'Address not found - enter manually'`
- `cityLabel: 'City'`

---

### Trin 10: Dokumentation

**`docs/technical-specs/architecture.md`**: Tilfoej nyt afsnit "External APIs":

```text
## External APIs

### DAWA (Danmarks Adressers Web API)
- **Endpoint**: `https://api.dataforsyningen.dk/adresser/autocomplete`
- **Formaal**: Adresse-autocomplete i Planner-modulet
- **Autentificering**: Ingen (aabent API)
- **Rate limiting**: Ingen officiel graense, debounced 300ms klient-side
- **Fallback**: Manuel fritekst-indtastning hvis API fejler
- **Data brugt**: vejnavn, husnr, postnr, postnrnavn
```

**`CHANGELOG.md`**: Opdater med den nye feature.

---

### Fallback-strategi

- Hvis DAWA API er nede eller returnerer fejl, fungerer feltet som normalt fritekst-input
- Brugeren kan altid taste manuelt og ignorere forslag
- Postnummer-feltet forbliver redigerbart saa brugeren kan rette det manuelt

