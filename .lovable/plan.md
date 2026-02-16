

## Fix: Naerheds-sortering ved redigering + fjern adresse-felt fra medarbejder

### Problem 1: Naerheds-sortering virker ikke ved redigering

Naar man aabner en eksisterende opgave til redigering, initialiseres `casePostcode` fra `zipCode` (som kommer fra `formData.zip_code`). Men for opgaver oprettet foer zip_code-kolonnen blev tilfojet, er denne vaerdi tom. Desuden udtraekkes postnummeret ikke fra den eksisterende `location`-streng ved opstart.

**Fix i `AssignmentFormFields.tsx`**:
- Ved initialisering: hvis `zipCode` er tom, forsoeges postnummeret udtrukket fra `location`-prop via regex (`/,\s*(\d{4})\s/`)
- Tilfoej en `useEffect` der koerer ved mount og udtraekker postnummeret fra location hvis casePostcode er tomt

### Problem 2: Fjern adresse-felt fra medarbejder-formularen

Jf. knowledge skal medarbejdere kun have `home_postcode` - ikke `home_address`. Adresse-feltet fjernes fra UI, men kolonnen beholdes i databasen for at undgaa breaking changes.

**Fix i `EmployeeFormDialog.tsx`** (linje 246-274):
- Fjern `home_address` Input-feltet
- Behold kun `home_postcode` Input-feltet
- Fjern grid-layoutet (`grid-cols-[100px_1fr]`) og lad postnummer-feltet staa alene
- Label aendres fra "Hjemmeadresse" til "Postnummer"

---

### Tekniske detaljer

**Fil 1: `src/components/Planner/AssignmentFormFields.tsx`**

Aendr initialiseringen af `casePostcode` (linje 85):
```text
// Nuvaerende:
const [casePostcode, setCasePostcode] = useState(zipCode || '');

// Ny logik: fallback til extraction fra location
const extractPostcode = (loc: string) => {
  const match = loc.match(/,\s*(\d{4})\s/);
  return match ? match[1] : '';
};
const [casePostcode, setCasePostcode] = useState(zipCode || extractPostcode(location) || '');
```

Tilfoej ogsaa en `useEffect` der synkroniserer `casePostcode` naar `location` aendres udefra (ved edit-load):
```text
useEffect(() => {
  if (!casePostcode && location) {
    const extracted = extractPostcode(location);
    if (extracted) {
      setCasePostcode(extracted);
      setZipCode(extracted);
    }
  }
}, [location]);
```

**Fil 2: `src/components/Employees/EmployeeFormDialog.tsx`**

Erstat linje 246-274 (Home Address sektionen):
- Fjern `home_address` Input
- Fjern `grid-cols-[100px_1fr]` layout
- Behold kun postnummer-feltet med label "Postnummer" / "Postcode"

**Fil 3: Oversaettelser** (hvis noedvendigt):
- Tilfoej/opdater `employees.homePostcode` key i `da/employees.ts` og `en/employees.ts`

**Fil 4: `CHANGELOG.md`**:
- Dokumenter begge aendringer

---

### Filer der aendres

| Fil | Aendring |
|-----|----------|
| `src/components/Planner/AssignmentFormFields.tsx` | Postnummer-extraction fra location ved edit |
| `src/components/Employees/EmployeeFormDialog.tsx` | Fjern adresse-felt, behold kun postnummer |
| `src/translations/da/employees.ts` | Tilfoej `homePostcode` key |
| `src/translations/en/employees.ts` | Tilfoej `homePostcode` key |
| `CHANGELOG.md` | Dokumenter aendringerne |

### Kvalitetstjek

- Ingen foelsom data eksponeres (postnummer er ikke PII jf. tekniske specs)
- Adresse-kolonnen beholdes i DB for backward compatibility
- Naerheds-sortering virker baade ved oprettelse og redigering
- UI fungerer i baade Standard, Kompakt og Gitter-visning
