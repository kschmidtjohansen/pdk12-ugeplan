

## Løsning: Hooks-fejl og eksportknap-animation

Denne opdatering løser den kritiske hooks-fejl og tilføjer en loading-animation til eksport-knappen.

---

### Problem 1: "Rendered more hooks than during the previous render"

**Årsag:**
I `AssignmentDetailsDialog.tsx` er der en tidlig `return null` (linje 35) der opstår **efter** `useAssignmentFiles` men **før** `useAssignmentMessages`. Dette betyder:

- Når `assignment = null`: 2 hooks køres (useTranslation, useAssignmentFiles)
- Når `assignment` har en værdi: 3 hooks køres (tilføjer useAssignmentMessages)

React kræver at antallet af hooks er det samme ved hver render.

**Løsning:**
Flyt alle hooks til **før** den betingede return statement. Brug `assignment?.id || null` som parameter til hooks.

```typescript
// FØR (fejl):
const { imageCount, documentCount } = useAssignmentFiles(assignment?.id || null);
if (!assignment) return null;
const { messages, exportMessages } = useAssignmentMessages(...);

// EFTER (korrekt):
const { imageCount, documentCount } = useAssignmentFiles(assignment?.id || null);
const { messages, exportMessages } = useAssignmentMessages(
  assignment?.id || null,
  assignment?.title,
  assignment?.assignedEmployees?.map(e => e.id) || [],
  assignment?.responsibleUserId
);
if (!assignment) return null;
```

---

### Problem 2: Eksportknap mangler loading-animation

**Løsning:**
1. Tilføj en `isExporting` state
2. Wrap `exportMessages` i en handler der sætter loading state
3. Vis en spinner-animation mens eksport er i gang

**Visual indikation:**
- Knappen viser et roterende ikon (spinner) mens eksport kører
- Teksten ændres til "Eksporterer..."
- Knappen disables under eksport

---

### Ændringer i koden

**`src/components/Dashboard/AssignmentDetailsDialog.tsx`:**

```typescript
const AssignmentDetailsDialog: React.FC<AssignmentDetailsDialogProps> = ({
  assignment,
  isOpen,
  onClose,
  cars,
  onEdit
}) => {
  const { t, currentLanguage } = useTranslation();
  const [showFiles, setShowFiles] = useState(false);
  const [isExporting, setIsExporting] = useState(false);  // NY: Export state
  
  // ALLE hooks før betinget return
  const { imageCount, documentCount } = useAssignmentFiles(assignment?.id || null);
  
  // Beregn assignedEmployeeIds før hook-kaldet
  const assignedEmployeeIds = assignment?.assignedEmployees?.map(e => e.id) 
    || assignment?.employees 
    || [];
  
  const { messages, exportMessages } = useAssignmentMessages(
    assignment?.id || null,  // Kan være null
    assignment?.title,
    assignedEmployeeIds,
    assignment?.responsibleUserId
  );
  
  // Nu er det sikkert at returnere tidligt
  if (!assignment) return null;

  // Handler med loading animation
  const handleExport = async () => {
    setIsExporting(true);
    try {
      exportMessages();
      // Kort delay for at vise animation
      await new Promise(resolve => setTimeout(resolve, 800));
    } finally {
      setIsExporting(false);
    }
  };

  // Resten af komponenten...
```

**Eksportknappen med animation:**

```tsx
{messages.length > 0 && (
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={handleExport}
    disabled={isExporting}
    className="h-8 text-primary hover:text-primary hover:bg-primary/10"
  >
    {isExporting ? (
      <>
        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        {t('planner.messages.exporting')}
      </>
    ) : (
      <>
        <Download className="h-4 w-4 mr-1.5" />
        {t('planner.messages.exportMessages')}
      </>
    )}
  </Button>
)}
```

---

### Nye translations

**`src/translations/da/planner.ts`:**
```typescript
messages: {
  // Eksisterende...
  exporting: 'Eksporterer...',
}
```

**`src/translations/en/planner.ts`:**
```typescript
messages: {
  // Eksisterende...
  exporting: 'Exporting...',
}
```

---

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Flyt hooks før betinget return, tilføj export animation |
| `src/translations/da/planner.ts` | Tilføj "exporting" oversættelse |
| `src/translations/en/planner.ts` | Tilføj "exporting" oversættelse |

---

### Teknisk forklaring

**Reacts regler for hooks:**
1. Hooks skal altid kaldes i samme rækkefølge
2. Hooks må ikke kaldes betinget (efter if/return)
3. Hooks skal kaldes på top-level af komponenten

Ved at flytte `useAssignmentMessages` op før `if (!assignment) return null`, sikrer vi at:
- Hooken altid kaldes (med `null` som ID hvis ingen assignment)
- Hooken internt håndterer `null` og returnerer tomme data
- React ser altid det samme antal hooks

