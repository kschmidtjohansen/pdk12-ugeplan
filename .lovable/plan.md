

## Løsning: Fjern duplikeret titel og flyt eksporter-knap

Billedet viser tydeligt problemet: Der er to "Beskeder" titler - én i den hvide header og én igen inde i besked-panelet. Eksporter-knappen skal flyttes op til headeren og styles i den blå temafarve.

---

### Problem

1. `AssignmentDetailsDialog.tsx` (linje 244-249) viser "Beskeder" titel i header
2. `AssignmentMessagesPanel.tsx` (linje 125-129) viser også sin egen "Beskeder" titel med eksporter-knap
3. Dette resulterer i duplikeret tekst som vist på billedet

---

### Løsning

**Fil 1: `src/components/Dashboard/AssignmentDetailsDialog.tsx`**

Opdater højre kolonnens header til at inkludere eksporter-knappen:

```typescript
{/* Right column: Messages sidebar */}
<div className="lg:w-2/5 flex flex-col min-h-0 bg-gradient-to-b from-muted/40 to-muted/20">
  <div className="px-5 py-4 border-b bg-background/60 backdrop-blur-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-sm font-semibold">
        <MessageSquare className="h-4 w-4 text-primary" />
        {t('planner.tabs.messages')}
      </div>
      {/* Eksporter knap - flyttes hertil */}
      <ExportButton /> {/* Ny prop eller callback fra AssignmentMessagesPanel */}
    </div>
  </div>
  ...
</div>
```

**Fil 2: `src/components/Assignment/AssignmentMessagesPanel.tsx`**

1. Fjern hele header-sektionen (linje 124-141)
2. Tilføj en `onExport` prop og `messageCount` for at lade parent-komponenten styre eksport-knappen
3. Eller: Eksporter en `exportMessages` funktion som parent kan kalde

**Enkleste løsning**: 
- Fjern header i `AssignmentMessagesPanel` helt
- Brug `useAssignmentMessages` hook direkte i `AssignmentDetailsDialog` for at få `exportMessages` funktion

---

### Ændringer i detaljer

**`src/components/Assignment/AssignmentMessagesPanel.tsx`:**

```diff
  return (
    <TooltipProvider>
-   <div className="flex flex-col h-full px-4 py-3">
-     {/* Header */}
-     <div className="flex items-center justify-between pb-4 border-b">
-       <div className="flex items-center gap-2">
-         <MessageSquare className="h-4 w-4 text-primary" />
-         <h3 className="font-medium">{t('planner.messages.title')}</h3>
-       </div>
-       {messages.length > 0 && (
-         <Button variant="outline" size="sm" onClick={exportMessages}>
-           <Download className="h-4 w-4" />
-           {t('planner.messages.exportMessages')}
-         </Button>
-       )}
-     </div>
+   <div className="flex flex-col h-full px-4 pt-2 pb-3">
      {/* Messages List */}
```

**`src/components/Dashboard/AssignmentDetailsDialog.tsx`:**

```diff
+ import { useAssignmentMessages } from '@/hooks/assignment/useAssignmentMessages';
+ import { Download } from 'lucide-react';

// Inde i komponenten:
+ const { messages, exportMessages } = useAssignmentMessages(
+   assignment.id,
+   assignment.title,
+   assignedEmployeeIds,
+   assignment.responsibleUserId
+ );

{/* Right column: Messages sidebar */}
<div className="lg:w-2/5 flex flex-col min-h-0 bg-gradient-to-b from-muted/40 to-muted/20">
  <div className="px-5 py-4 border-b bg-background/60 backdrop-blur-sm">
-   <div className="flex items-center gap-2.5 text-sm font-semibold">
-     <MessageSquare className="h-4 w-4 text-primary" />
-     {t('planner.tabs.messages')}
-   </div>
+   <div className="flex items-center justify-between">
+     <div className="flex items-center gap-2.5 text-sm font-semibold">
+       <MessageSquare className="h-4 w-4 text-primary" />
+       {t('planner.tabs.messages')}
+     </div>
+     {messages.length > 0 && (
+       <Button 
+         variant="ghost" 
+         size="sm" 
+         onClick={exportMessages}
+         className="text-primary hover:text-primary hover:bg-primary/10"
+       >
+         <Download className="h-4 w-4" />
+         {t('planner.messages.exportMessages')}
+       </Button>
+     )}
+   </div>
  </div>
```

---

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Tilføj eksporter-knap i header med blå styling |
| `src/components/Assignment/AssignmentMessagesPanel.tsx` | Fjern duplikeret header og eksporter-knap |

---

### Visuelt resultat

**Før:**
```
┌────────────────────────────┐
│ 💬 Beskeder                │  <- Header i dialog
├────────────────────────────┤
│ 💬 Beskeder    [Eksporter] │  <- Duplikeret header i panel
│                            │
│ Kasper Johansen 05 feb     │
│ Test                       │
```

**Efter:**
```
┌──────────────────────────────────────┐
│ 💬 Beskeder           [⬇ Eksporter]  │  <- Kun én header med blå knap
├──────────────────────────────────────┤
│                                      │
│ Kasper Johansen 05 feb               │
│ Test                                 │
```

