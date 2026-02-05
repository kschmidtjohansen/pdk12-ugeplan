

## Forbedringer: Dialog-styling, luk-knap og sletning af beskeder

Denne opdatering forbedrer dialogboksens visuelle udtryk, løser problemet med luk-knappen og tilføjer mulighed for at slette beskeder.

---

### Problem 1: Dialogboksen er for komprimeret

**Analyse af billedet:**
- Teksten og elementerne er for tæt på hinanden
- Beskeder-sidebaren mangler padding
- Filer-sektionen fylder for meget vertikalt
- Header-elementerne er for tæt sammen

**Løsning i `AssignmentDetailsDialog.tsx`:**
1. Øg padding fra `p-6` til `p-8` i detalje-sektionen
2. Øg `space-y-5` til `space-y-6` for mere luft mellem sektioner
3. Tilføj `leading-relaxed` til beskrivelser
4. Giv sidebaren (beskeder) mere padding: `px-4` → `px-5 py-4`
5. Øg minimumshøjde på dialogen for bedre proportioner
6. Tilføj subtle baggrundsnuancer for at skabe visuel adskillelse

**CSS-forbedringer:**
```css
/* Header */
className="px-6 pt-6 pb-4" → "px-8 pt-8 pb-6"

/* Detalje-sektion */
className="p-6 space-y-5" → "p-8 space-y-6"

/* Separators */
Tilføj className="my-2" for ekstra margin

/* Sidebar */
className="px-4 py-3" → "px-5 py-4"
```

---

### Problem 2: Luk-knappen (X) kan ikke trykkes på

**Årsag:** I `dialog.tsx` har DialogTitle `pr-8` som padding-right, men dialogens lukning har `right-4 top-4` placering. Med den nye `max-w-5xl` dialog og `flex items-center justify-between` i DialogTitle overlapper header-indholdet med luk-knappen.

**Løsning i `AssignmentDetailsDialog.tsx`:**
1. Øg `pr-8` i DialogTitle til `pr-14` for at give mere plads til luk-knappen
2. Alternativt tilføj `z-50` til luk-knappen i dialog.tsx for at sikre den er klikbar

**Løsning i `dialog.tsx`:**
1. Tilføj `z-50` til DialogPrimitive.Close knappen for at sikre den altid er over andre elementer
2. Øg størrelsen på hit-area lidt: `h-10 w-10` er allerede godt

---

### Problem 3: Sletning af egne beskeder + admin-rettigheder

**Database-tilføjelse:**
Ingen ny migration nødvendig - bruger eksisterende RLS policies.

**Hook-ændringer i `useAssignmentMessages.ts`:**
1. Tilføj `deleteMessage(messageId: string)` funktion
2. Tjek om bruger er ejer ELLER har skadeleder/admin rolle
3. Returner `canDelete(message)` helper-funktion

**UI-ændringer i `AssignmentMessagesPanel.tsx`:**
1. Tilføj slet-knap ved hover (som svar-knappen)
2. Vis slet-knap kun for:
   - Egne beskeder (altid)
   - Alle beskeder (hvis bruger er skadeleder/administrator)
3. Tilføj bekræftelsesdialog før sletning

**Nye translations:**
```typescript
messages: {
  // Eksisterende...
  deleteMessage: 'Slet besked',
  confirmDelete: 'Er du sikker på, at du vil slette denne besked?',
  messageDeleted: 'Besked slettet',
  errorDeletingMessage: 'Kunne ikke slette besked'
}
```

---

### Filer der ændres

| Fil | Handling | Beskrivelse |
|-----|----------|-------------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | ÆNDRES | Mere padding, luftigt layout |
| `src/components/ui/dialog.tsx` | ÆNDRES | z-index på luk-knap |
| `src/components/Assignment/AssignmentMessagesPanel.tsx` | ÆNDRES | Tilføj slet-knap + styling |
| `src/hooks/assignment/useAssignmentMessages.ts` | ÆNDRES | Tilføj deleteMessage funktion |
| `src/translations/da/planner.ts` | ÆNDRES | Nye oversættelser |
| `src/translations/en/planner.ts` | ÆNDRES | Nye oversættelser |

---

### Detaljeret layout-forbedring

**Før (komprimeret):**
```text
┌─────────────────────────────────────────────────────────┐
│⊙ Adresse                                    [Aftalt] X│  <- X overlapper
├─────────────────────────────────────────────────────────┤
│12-013517                        │Beskeder            │
│Beskrivelse                      │...                  │
│Tekst...                         │                     │
│DATO OG TIDSPUNKT                │                     │  <- For kompakt
```

**Efter (luftigt):**
```text
┌──────────────────────────────────────────────────────────────┐
│                                                            X │  <- Mere plads
│ ⊙ Adresse                                         [Aftalt]  │
├──────────────────────────────────────────────────────────────┤
│                                   │                          │
│  12-013517                        │   💬 Beskeder            │
│                                   │                          │
│  Beskrivelse                      │   ┌──────────────────┐   │
│  Tekst med god linjeafstand...    │   │ Kasper (09:01)   │   │
│                                   │   │ Test             │   │
│  ─────────────────────────────    │   │         [Svar]🗑│   │
│                                   │   └──────────────────┘   │
│  DATO OG TIDSPUNKT                │                          │
│  ─────────────────────────────    │   ┌──────────────────┐   │
│  📅 Torsdag 5. februar 2026       │   │ Skriv besked...  │   │
│  🕐 08:00 - 16:00                 │   └──────────────────┘   │
│                                   │                          │
│  DETALJER                         │                          │
│  ─────────────────────────────    │                          │
│  🚗 Service-Crafter               │                          │
│  👤 Kasper Johansen               │                          │
│  👥 Nicolai, Petrie, Mark         │                          │
│                                   │                          │
├───────────────────────────────────┴──────────────────────────┤
│  📁 Filer (📷 4)                                        ▼   │
└──────────────────────────────────────────────────────────────┘
```

---

### Tekniske detaljer

**Sletning af beskeder - sikkerhedstjek:**
```typescript
const canDeleteMessage = (message: AssignmentMessage): boolean => {
  if (!currentUser) return false;
  
  // Ejeren kan altid slette
  if (message.user_id === currentUser.id) return true;
  
  // Skadeleder og administrator kan slette alle
  return ['administrator', 'skadeleder'].includes(currentUser.role);
};
```

**Database-sletning:**
```typescript
const deleteMessage = async (messageId: string) => {
  const { error } = await supabase
    .from('assignment_messages')
    .delete()
    .eq('id', messageId);
    
  if (error) throw error;
  toast.success(t('planner.messages.messageDeleted'));
};
```

