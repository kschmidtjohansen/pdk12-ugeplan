

## Fix: Beskrivelse kan ikke scrolles på mobil i AssignmentDetailsDialog

### Problem

I `src/components/Dashboard/AssignmentDetailsDialog.tsx` er der tre nestede scroll-containere pa mobil:

1. `DialogContent` (linje 112): `max-h-[95dvh] overflow-y-auto`
2. Indre flex-div (linje 145): `overflow-y-auto`
3. `ScrollArea` (linje 148): Radix scroll-container

Nar alle tre er aktive samtidig pa mobil, kan ingen af dem scrolle korrekt — indholdet (inkl. beskrivelsen) bliver utilgaengeligt.

### Loesning

Forenkl scroll-hierarkiet sa kun EN container haandterer scroll pa mobil:

**`src/components/Dashboard/AssignmentDetailsDialog.tsx`:**

- **Linje 148**: Erstat `ScrollArea` med en almindelig `<div>` — pa mobil haandterer DialogContent allerede scroll via `overflow-y-auto`. ScrollArea er kun noedvendig pa desktop (lg+) hvor den indre kolonne har fast hoejde
- Alternativt: brug `ScrollArea` kun pa `lg:` og en plain div pa mobil via conditional rendering
- Fjern `overflow-y-auto` fra den indre flex-div (linje 145) pa mobil, sa kun DialogContent scroller

Konkret aendring pa linje 145:
```
// Fra:
className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden"
// Til:
className="flex-1 flex flex-col lg:flex-row min-h-0 lg:overflow-hidden"
```

Og pa linje 148:
```
// Fra:
<ScrollArea className="flex-1">
// Til:
<div className="flex-1 lg:overflow-y-auto">
```

Plus opdater lukning fra `</ScrollArea>` til `</div>` pa linje 250.

Dette sikrer at pa mobil scroller hele dialogen som en samlet enhed (via DialogContent), mens desktop beholder kolonne-baseret scroll.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Fjern nested scroll-containere pa mobil |
| `CHANGELOG.md` | Dokumenter fix af scroll-problem i mobilvisning |

### Kvalitetstjek

- Beskrivelse og alle sektioner er tilgaengelige via scroll pa mobil
- Desktop-layout (2-kolonne med chat) fungerer uaendret
- Ingen content clipping eller afskaret tekst
- Opgave 12-013477 og lignende kan ses fuldt ud pa mobil

