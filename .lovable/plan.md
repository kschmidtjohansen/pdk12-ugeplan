

## Løsning: Fjern duplikeret Filer-overskrift og flyt knapper

Dette er samme type problem som med beskeder - der er to "Filer" overskrifter når filer-panelet er åbent.

---

### Problem

1. `AssignmentDetailsDialog.tsx` (linje 243-245) viser "Filer" titel i den collapsible header
2. `AssignmentFilesPanel.tsx` (linje 227-236) viser også sin egen "Filer" titel med knapper

**Resultat**: Duplikeret tekst og knapperne er gemt inde i panelet i stedet for at være i headeren.

---

### Løsning

**Strategi**: 
1. Fjern den interne header fra `AssignmentFilesPanel.tsx`
2. Udvid headeren i `AssignmentDetailsDialog.tsx` til at inkludere filknapperne (Upload, Download PDF, Download alle, Opret mappe)
3. Eksporter nødvendige funktioner fra `useAssignmentFiles` hook til at styre dette

---

### Ændringer

**Fil 1: `src/components/Dashboard/AssignmentDetailsDialog.tsx`**

Tilføj de nødvendige funktioner fra `useAssignmentFiles` hook og flyt knapperne til headeren:

```typescript
// Udvid hvad vi henter fra hooken
const { 
  imageCount, 
  documentCount,
  files,
  uploadFile,
  downloadAll,
  generateImagePdfWithComments 
} = useAssignmentFiles(assignment?.id || null);

// Tilføj state for PDF generering og upload
const [generatingPdf, setGeneratingPdf] = useState(false);

// Handler for PDF
const handleGeneratePdf = async () => {
  setGeneratingPdf(true);
  await generateImagePdfWithComments(assignment?.title);
  setGeneratingPdf(false);
};
```

Opdater Filer-sektionens header:

```tsx
{/* Files section - collapsible */}
<div className="border-t bg-muted/20">
  <div className="flex items-center justify-between px-8 py-4">
    <button
      onClick={() => setShowFiles(!showFiles)}
      className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
    >
      <Files className="h-4 w-4 text-primary" />
      {t('planner.tabs.files')}
      {(imageCount > 0 || documentCount > 0) && (
        <span className="text-muted-foreground">
          ({imageCount > 0 && <><Image className="h-3 w-3 inline mr-0.5" />{imageCount}</>}
          {imageCount > 0 && documentCount > 0 && ' • '}
          {documentCount > 0 && <><FileText className="h-3 w-3 inline mr-0.5" />{documentCount}</>})
        </span>
      )}
      {showFiles ? <ChevronDown className="h-4 w-4 ml-1" /> : <ChevronUp className="h-4 w-4 ml-1" />}
    </button>
    
    {/* Knapper i headeren - blå stil som eksporter */}
    <div className="flex items-center gap-2">
      {imageCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGeneratePdf}
          disabled={generatingPdf}
          className="h-8 text-primary hover:text-primary hover:bg-primary/10"
        >
          {generatingPdf ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              {t('planner.files.generatingPdf')}
            </>
          ) : (
            <>
              <FileImage className="h-4 w-4 mr-1.5" />
              {t('planner.files.downloadAsPdf')}
            </>
          )}
        </Button>
      )}
      {files.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={downloadAll}
          className="h-8 text-primary hover:text-primary hover:bg-primary/10"
        >
          <FolderDown className="h-4 w-4 mr-1.5" />
          {t('planner.files.downloadAll')}
        </Button>
      )}
    </div>
  </div>
  
  {showFiles && (
    <div className="px-8 pb-6 max-h-72 overflow-y-auto">
      <AssignmentFilesPanel 
        assignmentId={assignment.id} 
        assignmentTitle={assignment.title || assignment.case_number || undefined}
        hideHeader={true}  // NY PROP
      />
    </div>
  )}
</div>
```

---

**Fil 2: `src/components/Assignment/AssignmentFilesPanel.tsx`**

Tilføj en `hideHeader` prop og skjul headeren når den er sat:

```typescript
interface AssignmentFilesPanelProps {
  assignmentId: string;
  assignmentTitle?: string;
  hideHeader?: boolean;  // NY
}

const AssignmentFilesPanel: React.FC<AssignmentFilesPanelProps> = ({
  assignmentId,
  assignmentTitle,
  hideHeader = false  // Default false for bagudkompatibilitet
}) => {
```

Wrap headeren i en betingelse:

```tsx
return (
  <div className="flex flex-col h-full">
    {/* Header with actions - kun vis hvis ikke skjult */}
    {!hideHeader && (
      <div className="flex items-center justify-between pb-3 border-b">
        {/* Eksisterende header-indhold */}
      </div>
    )}

    {/* Upload section */}
    <div className={cn("py-3 border-b space-y-2", hideHeader && "pt-0 border-t-0")}>
      {/* Eksisterende upload sektion */}
    </div>

    {/* Resten af komponenten... */}
  </div>
);
```

---

### Nye imports i AssignmentDetailsDialog

```typescript
import { FileImage, FolderDown } from 'lucide-react';
```

---

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Tilføj knapper i Filer-header, udvid useAssignmentFiles hook brug |
| `src/components/Assignment/AssignmentFilesPanel.tsx` | Tilføj hideHeader prop, skjul intern header når prop er sat |

---

### Visuelt resultat

**Før:**
```
┌─────────────────────────────────────────────────┐
│ 📁 Filer (📷 2 • 📄 1)                    [▼]   │  <- Header i dialog
├─────────────────────────────────────────────────┤
│ 📁 Filer (📷 2 • 📄 1)  [PDF] [Download] [+Mappe] │  <- Duplikeret header
│                                                  │
│ [Filter ▼] [Mappe ▼] [Upload]                    │
│ Fil 1...                                         │
└─────────────────────────────────────────────────┘
```

**Efter:**
```
┌──────────────────────────────────────────────────────────┐
│ 📁 Filer (📷 2 • 📄 1) [▼]    [📄 PDF] [📥 Download alle] │  <- Én header
├──────────────────────────────────────────────────────────┤
│ [Filter ▼] [Mappe ▼] [+ Mappe] [Upload]                  │
│ Fil 1...                                                 │
└──────────────────────────────────────────────────────────┘
```

---

### Knap-styling

Alle knapper i headeren får samme blå stil som eksporter-knappen:
- `variant="ghost"`
- `className="text-primary hover:text-primary hover:bg-primary/10"`
- Loading animation med `Loader2` for PDF-generering

