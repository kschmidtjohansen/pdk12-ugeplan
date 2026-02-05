

## Stor opdatering: Beskedsystem, filupload og notifikationsfiks

Denne opdatering tilføjer et komplet beskedsystem til sager, filupload-funktionalitet og retter notifikationsdropdown-visningen.

---

### Del 1: Database-ændringer

**Ny tabel: `assignment_messages`**
| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| id | uuid | Primær nøgle |
| assignment_id | uuid | Reference til assignments tabel |
| user_id | uuid | Afsender (reference til profiles) |
| message | text | Beskedindhold |
| created_at | timestamp | Oprettelsestidspunkt |

**Ny tabel: `assignment_files`**
| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| id | uuid | Primær nøgle |
| assignment_id | uuid | Reference til assignments tabel |
| user_id | uuid | Uploader (reference til profiles) |
| file_name | text | Originalt filnavn |
| file_path | text | Sti i storage bucket |
| folder_name | text | Mappenavn (fx "Demontering 05.02.2026") |
| file_size | integer | Filstørrelse i bytes |
| mime_type | text | MIME-type |
| created_at | timestamp | Oprettelsestidspunkt |

**RLS-policies:**
- Alle autentificerede brugere kan læse beskeder og filer på sager
- Alle autentificerede brugere kan oprette beskeder
- Admin/skadeleder kan uploade og slette filer
- Servicemedarbejdere kan uploade filer til sager de er tilknyttet

---

### Del 2: Storage bucket RLS-opdatering

Opdater RLS på `assignment-files` bucket:
- Servicemedarbejdere kan uploade filer til sager de er tilknyttet
- Behold eksisterende admin/skadeleder adgang

---

### Del 3: Backend komponenter

**Nye hooks:**
1. `src/hooks/assignment/useAssignmentMessages.ts`
   - Hent beskeder for en sag
   - Send ny besked
   - Realtime opdateringer via Supabase channels
   - Eksport-funktion til tekstfil

2. `src/hooks/assignment/useAssignmentFiles.ts`
   - Hent filer for en sag
   - Upload fil til mappe
   - Download fil
   - Slet fil
   - Eksport-funktion (download alle filer som zip eller individuelle)

---

### Del 4: UI-komponenter

**Nye komponenter:**

1. `src/components/Assignment/AssignmentMessagesPanel.tsx`
   - Besked-tråd visning
   - Tekstinput til ny besked
   - Afsendernavn og tidsstempel
   - Eksport-knap

2. `src/components/Assignment/AssignmentFilesPanel.tsx`
   - Fil-liste grupperet efter mappe
   - "Opret mappe" dialog (navn som "Demontering 05.02.2026")
   - Upload-knap
   - Download-knap per fil
   - Slet-knap (kun for admin/skadeleder og uploader)

3. `src/components/Assignment/AssignmentDetailsEnhanced.tsx`
   - Erstatter/udvider AssignmentDetailsDialog
   - Tabs: Detaljer | Beskeder | Filer
   - Fuld højde modal for bedre plads

---

### Del 5: Notifikationer for beskeder

**Udvidelse af notification-system:**
- Ny type: `message`
- Når en besked oprettes, send notifikation til:
  - Alle tilknyttede medarbejdere på sagen
  - Sagsansvarlig (hvis forskellig fra afsender)
- Link til sagen i notifikationen

**Ændringer:**
- `src/hooks/assignment/useAssignmentMessages.ts`: Kald addNotification ved ny besked
- `src/types/notification.ts`: Tilføj `message` type
- `src/components/Notifications/NotificationItem.tsx`: Tilføj ikon for message type

---

### Del 6: Notifikations-dropdown fix

**Problem:** Dropdown vises udenfor viewporten, beskeder er afkortet

**Løsning i `src/components/Layout/NavComponents/NotificationsDropdown.tsx`:**
- Fjern `line-clamp-2` for at vise fuld besked
- Tilføj `max-w-full` og `word-break: break-word`
- Reducer `collisionPadding` for bedre placering
- Tilføj `overflow-hidden` på container

**Løsning i `src/components/Notifications/NotificationItem.tsx`:**
- Fjern `line-clamp-2` fra `<p>` med besked
- Tilføj `whitespace-pre-wrap` for multi-linje support

---

### Del 7: Translations

**Nye oversættelser i `da/planner.ts` og `en/planner.ts`:**

```text
messages:
  title: 'Beskeder'
  sendMessage: 'Send besked'
  messagePlaceholder: 'Skriv en besked...'
  noMessages: 'Ingen beskeder endnu'
  exportMessages: 'Eksporter beskeder'
  messagesExported: 'Beskeder eksporteret'
  newMessage: 'Ny besked'
  
files:
  title: 'Filer'
  uploadFile: 'Upload fil'
  createFolder: 'Opret mappe'
  folderName: 'Mappenavn'
  folderPlaceholder: 'Fx: Demontering 05.02.2026'
  noFiles: 'Ingen filer endnu'
  downloadFile: 'Download fil'
  deleteFile: 'Slet fil'
  downloadAll: 'Download alle'
  fileUploaded: 'Fil uploadet'
  fileDeleted: 'Fil slettet'
  
tabs:
  details: 'Detaljer'
  messages: 'Beskeder'
  files: 'Filer'
```

**Nye oversættelser i `da/notifications.ts`:**
```text
newMessage: 'Ny besked på sag'
newMessageDescription: '{sender} skrev: "{preview}"'
```

---

### Del 8: Filer der oprettes/ændres

| Fil | Handling |
|-----|----------|
| `src/hooks/assignment/useAssignmentMessages.ts` | NY |
| `src/hooks/assignment/useAssignmentFiles.ts` | NY |
| `src/components/Assignment/AssignmentMessagesPanel.tsx` | NY |
| `src/components/Assignment/AssignmentFilesPanel.tsx` | NY |
| `src/components/Assignment/AssignmentDetailsTabs.tsx` | NY |
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | ÆNDRES - tilføj tabs |
| `src/components/Layout/NavComponents/NotificationsDropdown.tsx` | ÆNDRES - fix styling |
| `src/components/Notifications/NotificationItem.tsx` | ÆNDRES - fix styling + ny type |
| `src/types/notification.ts` | ÆNDRES - tilføj message type |
| `src/translations/da/planner.ts` | ÆNDRES - tilføj oversættelser |
| `src/translations/en/planner.ts` | ÆNDRES - tilføj oversættelser |
| `src/translations/da/notifications.ts` | ÆNDRES - tilføj oversættelser |
| `src/translations/en/notifications.ts` | ÆNDRES - tilføj oversættelser |

**Database migrations:**
- Opret `assignment_messages` tabel med RLS
- Opret `assignment_files` tabel med RLS
- Opdater storage RLS for servicemedarbejdere

---

### Flowdiagram: Besked-system

```text
┌─────────────────────────────────────────────────────────────┐
│                    ASSIGNMENT DIALOG                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Detaljer │  │ Beskeder │  │  Filer   │   <- Tabs        │
│  └──────────┘  └──────────┘  └──────────┘                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📝 Beskedtråd                        [Eksporter 📥] │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                     │   │
│  │ Søren Jensen (10:30)                               │   │
│  │ "Husk at tage billeder af skaden"                  │   │
│  │                                                     │   │
│  │ Peter Nielsen (11:45)                              │   │
│  │ "Billeder taget og uploadet"                       │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Skriv besked...                    ] [Send 📤]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Flowdiagram: Fil-system

```text
┌─────────────────────────────────────────────────────────────┐
│                       FILER TAB                             │
├─────────────────────────────────────────────────────────────┤
│  [+ Opret mappe]  [📤 Upload fil]                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 Demontering 05.02.2026                                 │
│  ├── 📷 IMG_001.jpg    [📥] [🗑️]                           │
│  ├── 📷 IMG_002.jpg    [📥] [🗑️]                           │
│  └── 📄 Noter.pdf      [📥] [🗑️]                           │
│                                                             │
│  📁 Færdiggørelse 10.02.2026                               │
│  └── 📷 Slutfoto.jpg   [📥] [🗑️]                           │
│                                                             │
│  📄 Løse filer (uden mappe)                                │
│  └── 📄 Kontrakt.pdf   [📥] [🗑️]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Sikkerhedshensyn

- Beskeder kan kun oprettes af autentificerede brugere
- Filer lagres i `assignment-files` bucket (allerede oprettet)
- RLS sikrer at kun relevante brugere kan se/redigere
- Notifikationer respekterer eksisterende RLS-policies
- Eksportfunktion respekterer brugerens læseadgang

