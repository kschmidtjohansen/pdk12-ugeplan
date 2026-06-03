## Problem
I `MultipleCarSelector.tsx` har popoveren med billisten `z-[60]`, mens `AlertDialog` (bekræftelses­dialogen "Bil allerede i brug") bruger standard `z-50` for både overlay og content. Resultatet er, at popoveren tegnes oven på dialogen, så "Brug alligevel"-knappen ikke kan klikkes.

## Løsning
Hæv z-index på AlertDialog'ens overlay og content til over popoveren (fx `z-[70]`), så dialogen og dens mørke overlay ligger korrekt øverst.

### Ændringer
- `src/components/Planner/MultipleCarSelector.tsx`
  - Tilføj `className="z-[70]"` på `<AlertDialogContent>`.
  - Tilføj eksplicit `<AlertDialogOverlay className="z-[70]" />` (importeret fra `@/components/ui/alert-dialog`) inde i `<AlertDialog>` — eller hæv kun content hvis overlayet allerede dækker korrekt. Verificeres ved at tjekke `src/components/ui/alert-dialog.tsx` for default-overlay.

Ingen logik- eller backend-ændringer. Rent UI/stacking-fix.

### Dokumentation
- Tilføj kort note i `CHANGELOG.md` under dagens dato.
