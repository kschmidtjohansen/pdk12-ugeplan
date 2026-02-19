
## Fix: Beskrivelse overlapper med beskeder på mobil

### Problem

I `AssignmentDetailsDialog.tsx` bruger begge kolonner `flex-1` på mobil, hvilket tvinger dem til at dele pladsen ligeligt. Detalje-kolonnen (med beskrivelsen) får ikke nok plads og dens indhold flyder bag besked-panelet.

### Loesning

**`src/components/Dashboard/AssignmentDetailsDialog.tsx`:**

1. **Venstre kolonne (linje 147)**: Fjern `flex-1` på mobil, så den tager sin naturlige hoejde. Brug kun `flex-1` på desktop (`lg:flex-1`):
   - Fra: `flex-1 ${isChatEnabled ? 'lg:w-3/5 lg:border-r' : ''} flex flex-col min-h-0`
   - Til: `lg:flex-1 ${isChatEnabled ? 'lg:w-3/5 lg:border-r' : ''} flex flex-col min-h-0`

2. **Hoejre kolonne / besked-panel (linje 325)**: Giv en fast hoejde på mobil i stedet for at konkurrere om flex-plads:
   - Fra: `lg:w-2/5 flex flex-col relative min-h-[300px] lg:min-h-0 overflow-hidden border-t lg:border-t-0 bg-gradient-to-b from-muted/40 to-muted/20`
   - Til: `lg:w-2/5 flex flex-col relative h-[350px] lg:h-auto lg:min-h-0 overflow-hidden border-t lg:border-t-0 bg-gradient-to-b from-muted/40 to-muted/20`

Disse to aendringer sikrer at:
- Mobil: Detaljer vises fuldt ud med naturlig hoejde, beskeder får en fast hoejde nedenunder, og hele dialogen scroller via `DialogContent`
- Desktop: Uaendret 2-kolonne layout med uafhaengig scroll

**`CHANGELOG.md`:** Dokumenter fix.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Fjern `flex-1` på mobil fra venstre kolonne, fast hoejde på besked-panel |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Beskrivelse er fuldt synlig og laesbar på mobil
- Beskeder stakker under beskrivelsen uden overlap
- Desktop 2-kolonne layout uaendret
- Overholder UI-guidelines (responsive, semantiske tokens)
