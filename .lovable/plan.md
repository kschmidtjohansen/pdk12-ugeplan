

## Tre forbedringer til adresse-haandtering i Planner

### Oversigt

1. **Fuld adresse-visning**: Vis adressen med postnummer og by i planner-listen (f.eks. "Julianelund 8, 7120 Vejle Ost")
2. **Samlet adresse-felt**: Fjern det separate postnummer-felt og integrer det i autocomplete-feltet
3. **"Alternativ" i stedet for "Region"**: Aendr label og farve for medarbejdere der ikke er i samme postnummer

---

### Trin 1: Fuld adresse-visning i planner-listen

Naar en adresse vaelges via DAWA, gemmes `location` som den fulde streng inkl. postnummer og by.

**`src/components/Planner/AddressAutocomplete.tsx`**:
- Aendr `handleSelect` saa `address` bliver `"Julianelund 8, 7120 Vejle Ost"` i stedet for kun `"Julianelund 8"`
- Format: `{vejnavn} {husnr}, {postnr} {postnrnavn}`

Dette goer at alle visninger (AssignmentCard, CompactAssignmentRow, AssignmentDetails) automatisk viser den fulde adresse, da de alle laeser fra `assignment.location`.

---

### Trin 2: Samlet adresse-felt (fjern separat postnummer)

**`src/components/Planner/AssignmentFormFields.tsx`**:
- Fjern det separate `casePostcode` Input-felt og `grid-cols-[120px_1fr]` layoutet
- Lad AddressAutocomplete staa alene som et enkelt felt
- Naar en DAWA-adresse vaelges, udtraek postnummeret automatisk og opdater `casePostcode` internt (til naerheds-sortering af medarbejdere) samt `zipCode`/`city` til databasen
- Postnummeret styres nu udelukkende via autocomplete-valg eller automatisk parsing af manuelt indtastet tekst

---

### Trin 3: "Alternativ" label med ny farve

**`src/components/Planner/EmployeeSelector.tsx`**:
- For `proximityLevel === 1` (regionalt match, foerste 2 cifre ens): vis "Alternativ" i stedet for "Region"
- Aendr badge-farven fra groen nuance (`bg-emerald-50 text-emerald-600`) til en tydelig alternativ farve (`bg-amber-50 text-amber-600 border-amber-200`)

**Oversaettelser** (`da/planner.ts` og `en/planner.ts`):
- Omdoeb `proximityRegion` til `proximityAlternative`
- Dansk: `'Alternativ'`
- Engelsk: `'Alternative'`

---

### Teknisk detalje: Postnummer-extraction fra manuelt input

Naar brugeren taster manuelt (uden at vaelge fra DAWA), forsoeges postnummeret udtrukket fra strengen via regex (f.eks. `/, (\d{4})/`). Hvis det lykkes, opdateres naerheds-sorteringen automatisk.

---

### Filer der aendres

| Fil | Aendring |
|-----|----------|
| `src/components/Planner/AddressAutocomplete.tsx` | Fuld adresse-format ved valg |
| `src/components/Planner/AssignmentFormFields.tsx` | Fjern separat postnummer-felt, enkelt adresse-input |
| `src/components/Planner/EmployeeSelector.tsx` | "Alternativ" label + amber farve for pl===1 |
| `src/translations/da/planner.ts` | `proximityRegion` -> `proximityAlternative: 'Alternativ'` |
| `src/translations/en/planner.ts` | `proximityRegion` -> `proximityAlternative: 'Alternative'` |
| `CHANGELOG.md` | Dokumenter aendringerne |

