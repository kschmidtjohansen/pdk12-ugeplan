

## Opdatering: Dialog i standard view, download alle filer, besked-sidebar og fil-tællere

Denne opdatering løser alle fire problemer og forbedrer brugeroplevelsen.

---

### Problem 1: AssignmentDetailsDialog vises ikke i standard view

**Årsag:** I standard view (`DaySection.tsx` → `AssignmentCard.tsx`) er der ingen `onViewDetails` callback - kun redigering åbnes direkte.

**Løsning:**
1. Tilføj `onViewDetails` callback til `DaySection` og `CurrentAndFutureDays` komponenterne
2. Tilføj `onViewDetails` callback til `AssignmentCard` (gør kortet klikbart for detaljer)
3. Brug samme `AssignmentDetailsDialog` som allerede bruges i compact view og MineOpgaver

**Filer der ændres:**
- `src/components/Planner/CurrentAndFutureDays.tsx` - tilføj `onViewDetails` prop
- `src/components/Planner/PastAssignments.tsx` - tilføj `onViewDetails` prop
- `src/components/Planner/DaySection.tsx` - tilføj `onViewDetails` prop og videregiv til AssignmentCard
- `src/components/Planner/AssignmentCard.tsx` - gør card-body klikbart for at vise detaljer

---

### Problem 2: Download alle filer og "vis alle" funktion

**Krav:**
- Download alle filer fra én mappe
- "Ingen mappe" filter viser alle filer med deres sti
- Download alle mapper med filerne inde i dem (bevarer struktur)

**Løsning i `AssignmentFilesPanel.tsx`:**
1. Tilføj "Download mappe" knap ved hver mappe-header
2. Tilføj filter-dropdown: "Alle filer" / vælg specifik mappe
3. Tilføj "Download alle" knap i header der downloader alt
4. Brug JSZip library til at skabe zip-filer med mappestruktur

**Ny dependency:**
- `jszip` - til at oprette zip-filer med mappestruktur

**Filer der ændres:**
- `src/components/Assignment/AssignmentFilesPanel.tsx` - ny UI og download-funktionalitet
- `src/hooks/assignment/useAssignmentFiles.ts` - tilføj `downloadFolder` og `downloadAll` funktioner

**Translations:**
- `downloadFolder`: 'Download mappe'
- `downloadAllFiles`: 'Download alle filer'
- `allFiles`: 'Alle filer'
- `preparingDownload`: 'Forbereder download...'

---

### Problem 3: Beskeder som sidebar i detaljer

**Krav:** Beskeder skal være synlige sammen med detaljer (ikke i en separat tab).

**Løsning:**
- Omdanner dialog-layout til en 2-kolonne struktur
- Venstre side: Detaljer (titel, dato, tid, biler, medarbejdere osv.)
- Højre side: Besked-sidebar med kompakt input
- Filer-tab bevares som separat tab under detaljer

**Nyt layout:**
```text
┌────────────────────────────────────────────────────────────────────┐
│ [Location]                                    [Status] [Rediger]  │
├──────────────────────────────────────┬─────────────────────────────┤
│  DETALJER                            │  BESKEDER                   │
│  ─────────────────────               │  ─────────────────          │
│  Titel: Sag 12345                    │  Søren (10:30):             │
│  Beskrivelse: ...                    │  "Husk billeder"            │
│                                      │                             │
│  Dato: 5. feb 2026                   │  Peter (11:45):             │
│  Tid: 08:00 - 16:00                  │  "Done"                     │
│                                      │                             │
│  Bil: VW Transporter                 │  ─────────────────          │
│  Medarbejdere: Søren, Peter          │  [Skriv besked...]  [Send]  │
│                                      │                             │
├──────────────────────────────────────┴─────────────────────────────┤
│  [Filer tab] - viser fil-panel som før                            │
└────────────────────────────────────────────────────────────────────┘
```

**Filer der ændres:**
- `src/components/Dashboard/AssignmentDetailsDialog.tsx` - nyt 2-kolonne layout

---

### Problem 4: Vis antal billeder og filer

**Krav:** Vis antal billeder og dokumenter i dialogen og eventuelt på kortene.

**Løsning:**
1. Tilføj en ny hook `useAssignmentFileCounts` eller udvid `useAssignmentFiles` til at returnere counts
2. Vis fil-tællere i dialog-header eller ved Filer-tab
3. Kategoriser i billeder (image/*) og dokumenter (resten)

**Visning:**
```text
📷 3 billeder • 📄 2 dokumenter
```

**Filer der ændres:**
- `src/hooks/assignment/useAssignmentFiles.ts` - tilføj `imageCount` og `documentCount`
- `src/components/Dashboard/AssignmentDetailsDialog.tsx` - vis tællere ved Filer-tab
- `src/translations/da/planner.ts` - tilføj `imageCount`, `documentCount` oversættelser

---

### Opsummering af ændringer

| Fil | Handling |
|-----|----------|
| `package.json` | Tilføj `jszip` dependency |
| `src/components/Planner/CurrentAndFutureDays.tsx` | Tilføj `onViewDetails` prop |
| `src/components/Planner/PastAssignments.tsx` | Tilføj `onViewDetails` prop |
| `src/components/Planner/DaySection.tsx` | Tilføj `onViewDetails` prop + videregiv |
| `src/components/Planner/AssignmentCard.tsx` | Gør klikbart for detaljer |
| `src/components/Assignment/AssignmentFilesPanel.tsx` | Download alle + filter |
| `src/hooks/assignment/useAssignmentFiles.ts` | Download funktioner + counts |
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | 2-kolonne layout med sidebar |
| `src/translations/da/planner.ts` | Nye oversættelser |
| `src/translations/en/planner.ts` | Nye oversættelser |

---

### Tekniske detaljer

**JSZip integration:**
```typescript
import JSZip from 'jszip';

const downloadAllAsZip = async () => {
  const zip = new JSZip();
  
  for (const file of files) {
    const folder = file.folder_name || 'Løse filer';
    const folderZip = zip.folder(folder);
    const blob = await downloadFileAsBlob(file);
    folderZip?.file(file.file_name, blob);
  }
  
  const content = await zip.generateAsync({ type: 'blob' });
  // Download zip file
};
```

**Responsive sidebar:**
- På desktop: 2-kolonne layout (60/40 split)
- På mobil: Beskeder vises under detaljer (stacked)

