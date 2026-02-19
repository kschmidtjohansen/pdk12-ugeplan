

## Fix: Beskrivelse overlapper med beskeder - endelig robust loesning

### Problemanalyse

Layoutet har fortsat problemer fordi:
1. **Linje 145**: Ydre wrapper har `min-h-0` som tillader flex-children at krympe under deres naturlige hoejde
2. **Linje 147**: Venstre kolonne har `min-h-0` som ogsaa tillader krympning
3. **Linje 325**: Besked-panelet har `relative` og `overflow-hidden` men ogsaa en fast `h-[350px]` pa mobil - dette er korrekt, men problemet er at venstre kolonne stadig krympes
4. Beskrivelsens container mangler `pb-4` for luft

### Loesning

Tre aendringer i `src/components/Dashboard/AssignmentDetailsDialog.tsx`:

1. **Linje 145 - Ydre wrapper**: Fjern `min-h-0` pa mobil, tilfoej kun pa desktop
   - Fra: `lg:flex-1 flex flex-col lg:flex-row min-h-0 lg:overflow-hidden`
   - Til: `lg:flex-1 flex flex-col lg:flex-row lg:min-h-0 lg:overflow-hidden`

2. **Linje 147 - Venstre kolonne**: Fjern `min-h-0` pa mobil, tilfoej `h-auto` og `flex-shrink-0` sa den aldrig krympes
   - Fra: `` lg:flex-1 ${isChatEnabled ? 'lg:w-3/5 lg:border-r' : ''} flex flex-col min-h-0 ``
   - Til: `` h-auto flex-shrink-0 lg:flex-1 lg:flex-shrink ${isChatEnabled ? 'lg:w-3/5 lg:border-r' : ''} flex flex-col lg:min-h-0 ``

3. **Linje 217-222 - Beskrivelses-container**: Tilfoej `pb-4` for padding i bunden
   - Fra: `<div className="space-y-2.5">`
   - Til: `<div className="space-y-2.5 pb-4">`

Disse aendringer sikrer:
- **Mobil**: Venstre kolonne vokser med indholdet (`h-auto`, `flex-shrink-0`). Beskrivelsen vises fuldt ud. Besked-panelet stakker nedenunder med sin faste hoejde. Hele dialogen scroller via `DialogContent` (linje 112: `overflow-y-auto`).
- **Desktop**: Uaendret. `lg:flex-1` og `lg:min-h-0` sikrer 2-kolonne layout med uafhaengig scroll.

**`CHANGELOG.md`**: Dokumenter endelig fix.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Fjern `min-h-0` pa mobil, tilfoej `h-auto` og `flex-shrink-0` pa venstre kolonne, `pb-4` pa beskrivelse |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Beskrivelsestekst er fuldt laesbar uanset laengde pa mobil
- Ingen sektioner overlapper
- Hele dialogen scroller pa mobil
- Desktop 2-kolonne layout uaendret
- Overholder UI-guidelines (semantiske tokens, responsive design)
