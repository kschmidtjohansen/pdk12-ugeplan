

## Plan: Fjern dobbelt scrollbar + sikre luk-knap er pænt placeret

### Rod-årsag
`DialogContent` (i `src/components/ui/dialog.tsx` linje 27-30) har **allerede** en intern wrapper med `overflow-y-auto max-h-[90vh] p-8` rundt om children. Flere dialoger tilføjer derfor fejlagtigt **også** `overflow-y-auto` / `max-h-[XXvh]` på selve `DialogContent` → giver to scroll-containere. Den ene scrollbar går desuden hen over den absolut-positionerede luk-knap (top-4 right-4), fordi luk-knappen ligger på det ydre `Content`, mens scrollbaren tilhører det indre wrapper-element der løber helt ud i kanten.

### Løsning (to dele)

**Del 1 — Forbedr `DialogContent` selv (engangsfix for hele appen)**
Fil: `src/components/ui/dialog.tsx`
- Behold den indre `overflow-y-auto`-wrapper, men giv den lidt højre-padding (`pr-12`) så scrollbaren ikke krydser luk-knappen, og lad luk-knappen sidde fast på det ydre Content (som nu).
- Tilføj `[&>div]:overscroll-contain` for pænere scroll-isolation.
- Sørg for at luk-knappen får højere z-index og en let baggrund så den ikke "drukner" i scrollende indhold (allerede `bg-background/50` — øg til `bg-background/90` + `backdrop-blur-sm` for synlighed under scroll).

**Del 2 — Fjern duplikerede scroll-klasser i kald-stederne**
Fjern `overflow-y-auto` (og overflødige `max-h-[…]`) fra `DialogContent`-brug i:
- `src/components/Planner/AssignmentDialogManager.tsx` (linje 102) — behold kun `max-w-4xl`
- `src/components/Duty/DutyAssignmentDialog.tsx` (linje 98) — behold kun `max-w-2xl`
- `src/components/Dashboard/CarAvailabilityModal.tsx` (linje 25)
- `src/components/Dashboard/AbsentEmployeesModal.tsx` (linje 33)
- `src/components/Admin/UserFormDialog.tsx` (linje 357)
- `src/components/Dashboard/AssignmentDetailsDialog.tsx` (linje 112) — denne bruger `flex flex-col p-0` med eget custom layout; her fjernes kun `overflow-y-auto` (scrollen håndteres internt af komponenten).

### Verifikation af luk-knap
Alle ovenstående dialoger bruger den fælles `DialogContent`, som **allerede** indeholder en luk-knap (`DialogPrimitive.Close` med X-ikon, linje 31-34 i `dialog.tsx`). Ingen dialog mangler altså en luk-knap — fixet i Del 1 sikrer at den ser pænt ud under scroll.

`AlertDialog` (bruges af f.eks. `SeriesActionDialog`, `EmployeeDeleteDialog`, `WarehouseDeleteDialog`) har bevidst **ingen** luk-knap — den lukkes via Cancel/Action-knapper i footer. Det er korrekt mønster og ændres ikke.

### Scope
- 7 filer (1 ui-primitiv + 6 forbrugere)
- Ingen logik-ændringer, kun CSS-klasser
- `CHANGELOG.md` opdateres

