

## Fix: Manglende tidsinput i opgaveformularen

### Problem
`AssignmentFormFields.tsx` modtager `fromTime`, `setFromTime`, `toTime` og `setToTime` som props (linje 63-66), men renderer aldrig nogen tid-inputfelter i JSX'en. Tidsfelterne er simpelthen udeladt fra formularen.

### Loesning
Tilfoej to `<Input type="time">` felter mellem dato-sektionen og medarbejder-sektionen i `AssignmentFormFields.tsx`.

### Aendringer

**`src/components/Planner/AssignmentFormFields.tsx`**

Indsaet foelgende mellem dato-sektionen (linje 307) og `<EmployeeSelector>` (linje 309):

```text
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="fromTime">{t('planner.fromTime')}</Label>
    <Input
      id="fromTime"
      type="time"
      value={fromTime}
      onChange={(e) => setFromTime(e.target.value)}
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="toTime">{t('planner.toTime')}</Label>
    <Input
      id="toTime"
      type="time"
      value={toTime}
      onChange={(e) => setToTime(e.target.value)}
    />
  </div>
</div>
```

**`CHANGELOG.md`** - Dokumenter rettelsen.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/components/Planner/AssignmentFormFields.tsx` | Tilfoej fra/til tidsinput-felter |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Tid vises korrekt i baade opret- og redigeringstilstand
- Validering (fromTime < toTime) er allerede haandteret i `AssignmentForm.tsx` linje 93-95
- Responsivt: `grid-cols-2` giver side-by-side paa alle skaermstoerrelser
- Ingen console.log uden DEV-guard
- Ingen hardcoded gray-farver
