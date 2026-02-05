

## Forbedringer til beskedsystem, filpanel og billedepreviews

Denne opdatering løser fejlen i fil-dropdown, tilføjer svar-funktionalitet til beskeder og tilføjer billedepreviews.

---

### Del 1: Fix Select-fejlen i filpanelet

**Problem:** `<SelectItem value="">` er ikke tilladt i Radix UI Select - tom streng udløser fejl.

**Løsning i `src/components/Assignment/AssignmentFilesPanel.tsx`:**
- Brug en speciel værdi som `"__none__"` i stedet for tom streng
- Opdater `handleFileSelect` til at konvertere `"__none__"` tilbage til `undefined`
- Opdater `onValueChange` til at håndtere denne konvertering

```typescript
// Før
<SelectItem value="">Ingen mappe</SelectItem>

// Efter
<SelectItem value="__none__">Ingen mappe</SelectItem>
```

---

### Del 2: Tilføj svar-funktionalitet til beskeder

**Database-migration:**
- Tilføj `reply_to_id` kolonne til `assignment_messages` tabellen
- Reference til en anden besked (nullable)

**Ændringer i `src/hooks/assignment/useAssignmentMessages.ts`:**
- Udvid `AssignmentMessage` interface med `reply_to_id` og `reply_to` (reference til parent besked)
- Udvid `sendMessage` til at tage en optional `replyToId` parameter
- Hent parent besked-info når beskeder hentes

**Ændringer i `src/components/Assignment/AssignmentMessagesPanel.tsx`:**
- Tilføj state for `replyingTo` (hvilken besked man svarer på)
- Vis "Svar"-knap på hver besked ved hover
- Vis en "Svarer på: [besked-preview]" over tekstfeltet når man svarer
- Vis reference til parent-besked i besked-visningen (indrykning eller quote)

**UI-flow:**
```text
┌─────────────────────────────────────────────────────────┐
│ Søren Jensen (10:30)                        [Svar 💬]  │
│ "Husk at tage billeder af skaden"                      │
│                                                         │
│   ↳ Peter Nielsen (11:45)                   [Svar 💬]  │
│     Svarer på: "Husk at tage billeder..."              │
│     "Billeder er taget og uploadet"                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Svarer på: "Husk at tage billeder af skaden"    [×]    │
├─────────────────────────────────────────────────────────┤
│ [Skriv svar...                          ] [Send 📤]   │
└─────────────────────────────────────────────────────────┘
```

---

### Del 3: Tilføj billedepreviews i fil-oversigten

**Ændringer i `src/hooks/assignment/useAssignmentFiles.ts`:**
- Tilføj `getFilePreviewUrl` funktion der genererer en signed URL for billeder
- Returner preview URLs sammen med fil-data

**Ændringer i `src/components/Assignment/AssignmentFilesPanel.tsx`:**
- Tilføj `ImagePreviewDialog` sub-komponent til at vise billeder i fuld størrelse
- Opdater `FileItem` komponenten:
  - Vis thumbnail preview for billeder (aspect-ratio container)
  - Gør billedet klikbart for at åbne fuldskærms-preview
- Tilføj state for valgt billede til preview

**UI-eksempel:**
```text
📁 Demontering 05.02.2026
├── ┌────────┐ IMG_001.jpg    [📥] [🗑️]
│   │  🖼️   │ 1.2 MB • 05 feb
│   └────────┘
├── ┌────────┐ IMG_002.jpg    [📥] [🗑️]
│   │  🖼️   │ 0.8 MB • 05 feb
│   └────────┘
└── 📄 Noter.pdf              [📥] [🗑️]
    256 KB • 05 feb
```

---

### Del 4: Nye translations

**`src/translations/da/planner.ts` - messages sektion:**
```typescript
messages: {
  // Eksisterende...
  reply: 'Svar',
  replyingTo: 'Svarer på',
  cancelReply: 'Annuller svar',
  inReplyTo: 'Svar på'
}
```

**`src/translations/da/planner.ts` - files sektion:**
```typescript
files: {
  // Eksisterende...
  noFolder: 'Ingen mappe',
  imagePreview: 'Forhåndsvisning',
  closePreview: 'Luk'
}
```

---

### Del 5: Filer der ændres

| Fil | Ændring |
|-----|---------|
| `supabase/migrations/XXXX.sql` | NY - tilføj reply_to_id kolonne |
| `src/integrations/supabase/types.ts` | AUTO - opdateret fra migration |
| `src/hooks/assignment/useAssignmentMessages.ts` | ÆNDRES - tilføj reply support |
| `src/hooks/assignment/useAssignmentFiles.ts` | ÆNDRES - tilføj preview URL |
| `src/components/Assignment/AssignmentMessagesPanel.tsx` | ÆNDRES - tilføj svar UI |
| `src/components/Assignment/AssignmentFilesPanel.tsx` | ÆNDRES - fix Select + preview |
| `src/translations/da/planner.ts` | ÆNDRES - nye oversættelser |
| `src/translations/en/planner.ts` | ÆNDRES - nye oversættelser |

---

### Tekniske detaljer

**Database-migration:**
```sql
-- Tilføj reply_to_id til assignment_messages
ALTER TABLE public.assignment_messages 
ADD COLUMN reply_to_id UUID REFERENCES public.assignment_messages(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_assignment_messages_reply_to_id 
ON public.assignment_messages(reply_to_id);
```

**Billedepreviews:**
- Bruger Supabase Storage `createSignedUrl` for at generere midlertidige URLs
- Thumbnail vises inline med max højde 60px
- Klik åbner dialog med fuldt billede
- Kun for MIME-types der starter med `image/`

