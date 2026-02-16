

## Fase 5, Del 2: Naerheds-baseret Booking-forslag

### Oversigt

Tilfoej et "Sagens postnummer"-felt til opgaveformularen. Naar et postnummer indtastes, sorteres medarbejderlisten automatisk efter naerhed og markeres med ikoner/badges. Inkluderer automatisk verifikation til sidst.

---

### Trin 1: State i AssignmentFormFields

**`src/components/Planner/AssignmentFormFields.tsx`**:
- Tilfoej lokal state: `const [casePostcode, setCasePostcode] = useState('')`
- Tilfoej nyt input-felt lige foer `<EmployeeSelector>`:

```text
<div className="space-y-2">
  <Label htmlFor="casePostcode">{t('planner.casePostcode')}</Label>
  <Input
    id="casePostcode"
    value={casePostcode}
    onChange={(e) => setCasePostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
    placeholder={t('planner.casePostcodePlaceholder')}
    maxLength={4}
  />
</div>
```

- Send `casePostcode` som ny prop til `<EmployeeSelector>`.

---

### Trin 2: Proximity-logik i EmployeeSelector

**`src/components/Planner/EmployeeSelector.tsx`**:

Tilfoej ny prop `casePostcode?: string` til `EmployeeSelectorProps`.

Erstat `const filteredEmployees = employees;` (linje 42) med en `useMemo`-baseret sortering:

```text
import { useMemo } from 'react';

const sortedEmployees = useMemo(() => {
  if (!casePostcode || casePostcode.length !== 4) {
    return [...employees].sort((a, b) => a.name.localeCompare(b.name));
  }

  const getProximityLevel = (emp: Employee): number => {
    if (!emp.home_postcode) return 3;
    if (emp.home_postcode === casePostcode) return 0;
    if (emp.home_postcode.substring(0, 2) === casePostcode.substring(0, 2)) return 1;
    return 2;
  };

  return [...employees].sort((a, b) => {
    const diff = getProximityLevel(a) - getProximityLevel(b);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}, [employees, casePostcode]);
```

Brug `sortedEmployees` i stedet for `filteredEmployees` i renderingen (linje 132).

---

### Trin 3: UI-markering med badges

I render-loopet (linje 174-236) tilfoej proximity-badges i badge-omraadet (efter linje 200, sammen med eksisterende badges):

```text
// Beregn proximity inden return
const proximityLevel = casePostcode?.length === 4 && employee.home_postcode
  ? (employee.home_postcode === casePostcode ? 0
    : employee.home_postcode.substring(0,2) === casePostcode.substring(0,2) ? 1 : 2)
  : -1;

// I badge-sektionen (linje 201-231):
{proximityLevel === 0 && (
  <Badge className="text-xs bg-green-100 text-green-700 border-green-300">
    <MapPin className="h-3 w-3 mr-1" />
    {t('planner.proximityExact')}
  </Badge>
)}
{proximityLevel === 1 && (
  <Badge className="text-xs bg-emerald-50 text-emerald-600 border-emerald-200">
    {t('planner.proximityRegion')}
  </Badge>
)}
```

Import `MapPin` fra `lucide-react`.

---

### Trin 4: Oversaettelser

**`src/translations/da/planner.ts`**:
```text
casePostcode: 'Sagens postnummer',
casePostcodePlaceholder: 'f.eks. 7000',
proximityExact: 'Naermest',
proximityRegion: 'Region',
```

**`src/translations/en/planner.ts`**:
```text
casePostcode: 'Case postcode',
casePostcodePlaceholder: 'e.g. 7000',
proximityExact: 'Closest',
proximityRegion: 'Region',
```

---

### Trin 5: Dokumentation

**`docs/product-roadmap/features.md`**: Tilfoej sektion "Geografisk Optimering".

**`docs/implementation-plan/tasks.md`**: Marker Fase 5 Del 2 som faerdigt.

**`CHANGELOG.md`**: Tilfoej entry.

---

### Trin 6: End-to-end verifikation

Efter implementering udfoeeres foelgende tjek:

1. **Naviger til /planner** og aaben "Ny opgave"-dialogen.
2. **Bekraeft** at feltet "Sagens postnummer" vises over medarbejder-selectoren.
3. **Indtast et postnummer** (f.eks. 7000) og aaben medarbejder-dropdown:
   - Medarbejdere med matchende postnr. skal staa oeverst med groen "Naermest"-badge og MapPin-ikon.
   - Medarbejdere med regional match (samme foerste 2 cifre) skal have "Region"-badge.
   - Oevrige medarbejdere vises normalt nedenunder.
4. **Slet postnummeret** og bekraeft at listen vender tilbage til alfabetisk sortering uden badges.
5. **Tjek konsollen** for eventuelle fejl.
6. **Tjek mobil-responsivitet** ved at verificere layout paa smal viewport.

---

### Kvalitetstjek

- Sortering sker i `useMemo` - ingen unoevendig genberegning
- Kun numerisk input tillades via regex-filter
- Tomt felt = normal alfabetisk sortering
- Ingen database-aendringer (bruger eksisterende `home_postcode`)
- Responsive: Standard Input-felt, fungerer paa alle skaermstoerrelser
- Ingen foelsom data logges

