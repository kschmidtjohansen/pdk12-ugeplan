

## Fix: Beskeder overlapper beskrivelsen på mobil

### Problem

På mobil vises besked-panelet (højre kolonne) oven på beskrivelsen i stedet for at stakke under detalje-kolonnen. Dette skyldes at besked-containeren (linje 325) mangler en fast højde-begrænsning på mobil, og `AssignmentMessagesPanel` sandsynligvis bruger absolut positionering internt, som flyder over detalje-indholdet.

### Løsning

**`src/components/Dashboard/AssignmentDetailsDialog.tsx`:**

- Tilføj `border-t` og en fast min-height på mobil til besked-containeren (linje 325), så den stakker korrekt under detaljerne:
  - Ændr klassen til: `lg:w-2/5 flex flex-col min-h-[300px] lg:min-h-0 border-t lg:border-t-0 bg-gradient-to-b from-muted/40 to-muted/20`
- Sørg for at besked-panelet ikke overlapper ved at give den en `relative` position og `overflow-hidden` på mobil

**`CHANGELOG.md`:**
- Dokumentér fix af besked-overlap på mobilvisning

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Tilføj mobil-specifikke layout-begrænsninger til besked-panelet |
| `CHANGELOG.md` | Dokumentér fix |

### Kvalitetstjek
- Beskeder stakker under beskrivelsen på mobil (ingen overlap)
- Desktop 2-kolonne layout uændret
- Besked-input felt forbliver synligt og brugbart
- Overholder semantiske farvetokens og UI-guidelines

