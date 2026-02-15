

## 3 konkrete polish-forslag til visuelt loft

### Forslag 1: Subtil hover-transition på AssignmentCard og DaySection

**Problem:** AssignmentCard har `hover:border-polygon-purple transition-colors`, men mangler en blod skygge-overgang. Kortet foler sig "fladt" ved hover. DaySection's klikbare dato-header bruger `hover:bg-gray-50` (hardcoded, dark mode-inkompatibelt) uden skygge.

**AEndring:**
- `AssignmentCard.tsx` (linje 137): Tilfoej `hover:shadow-xl transition-all duration-200` i stedet for kun `transition-colors`
- `DaySection.tsx` (linje 74): Erstat `hover:bg-gray-50` med `hover:bg-muted/50` (dark mode-korrekt)

| Fil | Linje | Fra | Til |
|-----|-------|-----|-----|
| `AssignmentCard.tsx` | 137 | `hover:border-polygon-purple transition-colors` | `hover:border-polygon-purple hover:shadow-xl transition-all duration-200` |
| `DaySection.tsx` | 74 | `hover:bg-gray-50` | `hover:bg-muted/50` |
| `DaySection.tsx` | 88-90 | `text-gray-500` (chevron-ikoner) | `text-muted-foreground` |

---

### Forslag 2: Forbedret typografi-hierarki paa PageHeader

**Problem:** `PageHeader.tsx` bruger `text-2xl font-semibold` til titlen. Sammenlignet med WelcomeHeader (som bruger `text-3xl font-bold tracking-tight`) virker side-headerne visuelt svagere. Derudover mangler beskrivelsen tilstraekkelig linjehojde.

**AEndring i `PageHeader.tsx`:**
- Titel: `text-2xl font-semibold` -> `text-2xl font-bold tracking-tight` (matcher WelcomeHeader-stilen)
- Beskrivelse: Tilfoej `leading-relaxed` for bedre laesbarhed
- Kort-container: Tilfoej `shadow-sm` for subtil dybde (matcher InteractiveMetricCard)

| Fil | Linje | Fra | Til |
|-----|-------|-----|-----|
| `PageHeader.tsx` | 16 | `bg-card rounded-xl border border-border p-6 shadow-sm` | `bg-card rounded-2xl border border-border/50 p-6 shadow-md` |
| `PageHeader.tsx` | 19 | `text-2xl font-semibold text-foreground` | `text-2xl font-bold tracking-tight text-foreground` |
| `PageHeader.tsx` | 21 | `text-sm text-muted-foreground` | `text-sm text-muted-foreground leading-relaxed` |

---

### Forslag 3: Forbedret tom-tilstand i DaySection med ikon og blodere styling

**Problem:** Naar en dag er tom, vises en simpel `border-dashed` div med tekst (linje 131). Det ser minimalistisk ud, men mangler visuel "varme" sammenlignet med resten af appens kort-baserede design.

**AEndring i `DaySection.tsx` (linje 131):**

Fra:
```html
<div class="p-4 border border-dashed rounded-md text-center text-muted-foreground">
```

Til:
```html
<div class="py-8 px-4 border border-dashed border-border/50 rounded-xl text-center text-muted-foreground bg-muted/20">
  <CalendarX2 icon (h-8 w-8, text-muted-foreground/50, centered)>
  <p>Tekst</p>
</div>
```

Tilfojer: Lucide `CalendarX2`-ikon over teksten, blodere afrunding (`rounded-xl`), let baggrund (`bg-muted/20`), og mere vertikal luft (`py-8`).

---

### Samlet filplan

| Fil | AEndring |
|-----|---------|
| `src/components/Planner/AssignmentCard.tsx` | Tilfoej `hover:shadow-xl transition-all duration-200` |
| `src/components/Planner/DaySection.tsx` | Fix hardcoded graa, forbedret tom-tilstand med ikon |
| `src/components/Layout/PageHeader.tsx` | Skarpere typografi, blodere kort-styling |
| `CHANGELOG.md` | Tilfoej "Visuel polish - 2026-02-15" |

Alle aendringer er rent kosmetiske - ingen funktionalitet aendres.

