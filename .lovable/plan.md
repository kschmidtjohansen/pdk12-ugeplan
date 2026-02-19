

## Fix: Beskrivelse overlapper med beskeder pa mobil (endelig loesning)

### Problem

Tre `flex-1` klasser kæmper om plads pa mobil:
- Linje 145: Ydre wrapper (`flex-1 flex flex-col lg:flex-row`) — fylder hele DialogContent
- Linje 148: Indre detalje-div (`flex-1 lg:overflow-y-auto`) — fylder hele wrapperen
- Resultat: Beskrivelsestekst komprimeres og besked-panelet laegger sig oveni

### Loesning

Fjern `flex-1` pa mobil fra de to containere og tilfoej text-wrapping pa beskrivelsen. Pa mobil skal alt indhold flyde med naturlig hoejde, og kun DialogContent (linje 112) haandterer scroll.

**`src/components/Dashboard/AssignmentDetailsDialog.tsx`:**

1. **Linje 145** — Ydre wrapper: tilfoej `lg:` prefix til flex-1
   - Fra: `flex-1 flex flex-col lg:flex-row min-h-0 lg:overflow-hidden`
   - Til: `lg:flex-1 flex flex-col lg:flex-row min-h-0 lg:overflow-hidden`

2. **Linje 148** — Indre detalje-scroll-container: tilfoej `lg:` prefix til flex-1
   - Fra: `flex-1 lg:overflow-y-auto`
   - Til: `lg:flex-1 lg:overflow-y-auto`

3. **Beskrivelsestekst (linje 241)** — Tilfoej korrekt text-wrapping og bund-padding:
   - Fra: `text-sm leading-relaxed text-foreground/90`
   - Til: `text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words`

Disse tre aendringer sikrer:
- Mobil: Alle sektioner (detaljer, beskrivelse, beskeder, dato, filer) stakker vertikalt med naturlig hoejde. Hele dialogen scroller via DialogContent.
- Desktop: Uaendret 2-kolonne layout med uafhaengig scroll i venstre kolonne.

**`CHANGELOG.md`:** Dokumenter endelig fix af mobil-overlap.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Fjern `flex-1` pa mobil fra ydre wrapper og indre container, tilfoej text-wrapping |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Beskrivelsestekst er fuldt laesbar og knækker korrekt pa mobil
- Beskeder stakker under beskrivelsen uden overlap
- Man kan scrolle ned til dato, filer og alle sektioner
- Desktop 2-kolonne layout uaendret
- Overholder UI-guidelines (semantiske tokens, responsive)
