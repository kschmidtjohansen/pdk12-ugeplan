

## Billedkommentarer og PDF-eksport med billeder

Denne opdatering tilføjer mulighed for at knytte kommentarer til billeder ved upload og generere en PDF med alle billeder og deres kommentarer.

---

### Del 1: Database - Tilføj kommentar-felt til assignment_files

**Ny migration:**
Tilføj en `comment` kolonne til `assignment_files` tabellen for at gemme billedkommentarer.

```sql
ALTER TABLE public.assignment_files 
ADD COLUMN comment TEXT NULL;
```

---

### Del 2: Hook-ændringer i useAssignmentFiles.ts

**Opdater AssignmentFile interface:**
```typescript
export interface AssignmentFile {
  // Eksisterende felter...
  comment: string | null;  // NY
}
```

**Opdater uploadFile:**
- Tilføj optional `comment` parameter
- Gem kommentar i database ved upload

**Tilføj updateFileComment:**
- Ny funktion til at redigere kommentar på eksisterende filer

**Tilføj generateImagePdfWithComments:**
- Ny funktion der bruger `pdf-lib` til at generere PDF
- Henter alle billeder og inkluderer dem med kommentarer

---

### Del 3: UI - Upload med kommentar

**Workflow for upload med kommentar:**

1. Bruger vælger fil(er) → åbner en dialog
2. For hvert billede vises et preview med et tekstfelt til kommentar
3. Bruger kan skrive kommentar og trykke "Upload"

**Ny dialog: `ImageUploadWithCommentDialog`**
```text
┌──────────────────────────────────────────────────────────┐
│  Upload billeder                                    [X]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────┐                                          │
│  │   🖼️      │  IMG_001.jpg                             │
│  │  Preview   │  ────────────────────────────────────    │
│  └────────────┘  [ Tilføj kommentar til dette billede ]  │
│                                                          │
│  ┌────────────┐                                          │
│  │   🖼️      │  IMG_002.jpg                             │
│  │  Preview   │  ────────────────────────────────────    │
│  └────────────┘  [ Tilføj kommentar til dette billede ]  │
│                                                          │
│  Vælg mappe: [Dropdown ▼]                                │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                            [Annuller]  [Upload billeder] │
└──────────────────────────────────────────────────────────┘
```

---

### Del 4: UI - Vis og rediger kommentar

**I FileItem-komponenten:**
- Vis kommentar under filnavn hvis den findes
- Tilføj en lille edit-knap til at redigere kommentar

**Layout:**
```text
┌────────────┐ IMG_001.jpg                    [📥] [✏️] [🗑️]
│   🖼️      │ 1.2 MB • 05 feb • Kasper
│  Preview   │ 💬 "Skade på venstre hjørne"
└────────────┘
```

---

### Del 5: PDF-generering med billeder og kommentarer

**Ny knap i header:**
"Download billeder som PDF" - kun synlig hvis der er billeder

**PDF-layout pr. side:**
```text
┌─────────────────────────────────────────┐
│            [Sagsnummer/Titel]           │  <- Header
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │         BILLEDE                 │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Kommentar: Skade på venstre hjørne     │
│  Uploadet: 05. feb 2026 • Kasper        │
│                                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │         BILLEDE 2               │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Kommentar: Fugtskade på loft           │
│  Uploadet: 05. feb 2026 • Kasper        │
│                                         │
└─────────────────────────────────────────┘
```

**Teknisk implementering med pdf-lib:**
```typescript
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const generateImagePdfWithComments = async () => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const imageFiles = files.filter(f => f.mime_type?.startsWith('image/'));
  
  for (const file of imageFiles) {
    const page = pdfDoc.addPage([595, 842]); // A4
    
    // Download og embed billedet
    const imageBlob = await downloadFileAsBlob(file);
    const imageBytes = await imageBlob.arrayBuffer();
    
    // Detect image type og embed
    if (file.mime_type?.includes('png')) {
      const image = await pdfDoc.embedPng(imageBytes);
      // Tegn billede centreret
      page.drawImage(image, { x, y, width, height });
    } else if (file.mime_type?.includes('jpeg') || file.mime_type?.includes('jpg')) {
      const image = await pdfDoc.embedJpg(imageBytes);
      page.drawImage(image, { x, y, width, height });
    }
    
    // Tilføj kommentar og metadata
    page.drawText(file.comment || 'Ingen kommentar', { x, y, font });
    page.drawText(`Uploadet: ${formatDate(file.created_at)} • ${file.uploader?.name}`, {...});
  }
  
  const pdfBytes = await pdfDoc.save();
  // Download PDF
};
```

---

### Del 6: Nye translations

**`src/translations/da/planner.ts` - files sektion:**
```typescript
files: {
  // Eksisterende...
  addComment: 'Tilføj kommentar',
  editComment: 'Rediger kommentar',
  commentPlaceholder: 'Tilføj kommentar til dette billede...',
  noComment: 'Ingen kommentar',
  downloadAsPdf: 'Download billeder som PDF',
  generatingPdf: 'Genererer PDF...',
  pdfGenerated: 'PDF genereret',
  uploadWithComment: 'Upload billeder',
  uploadImages: 'Upload billeder'
}
```

**`src/translations/en/planner.ts` - files sektion:**
```typescript
files: {
  // Eksisterende...
  addComment: 'Add comment',
  editComment: 'Edit comment',
  commentPlaceholder: 'Add a comment to this image...',
  noComment: 'No comment',
  downloadAsPdf: 'Download images as PDF',
  generatingPdf: 'Generating PDF...',
  pdfGenerated: 'PDF generated',
  uploadWithComment: 'Upload images',
  uploadImages: 'Upload images'
}
```

---

### Del 7: Filer der ændres

| Fil | Handling | Beskrivelse |
|-----|----------|-------------|
| `supabase/migrations/XXXX.sql` | NY | Tilføj comment kolonne |
| `src/integrations/supabase/types.ts` | AUTO | Opdateret fra migration |
| `src/hooks/assignment/useAssignmentFiles.ts` | ÆNDRES | Upload med kommentar, updateComment, generatePDF |
| `src/components/Assignment/AssignmentFilesPanel.tsx` | ÆNDRES | Upload-dialog, vis kommentar, PDF-knap |
| `src/translations/da/planner.ts` | ÆNDRES | Nye oversættelser |
| `src/translations/en/planner.ts` | ÆNDRES | Nye oversættelser |

---

### Tekniske overvejelser

**Billedtyper understøttet i pdf-lib:**
- JPEG/JPG ✅
- PNG ✅
- Andre formater (WebP, HEIC, etc.) - skal konverteres først eller springes over

**PDF-størrelse:**
- Billeder skaleres ned til max 500x400 px for at holde filstørrelsen nede
- Bevarer aspect ratio

**Håndtering af ikke-understøttede formater:**
- WebP og andre formater vil blive sprunget over med en advarsel i toast

