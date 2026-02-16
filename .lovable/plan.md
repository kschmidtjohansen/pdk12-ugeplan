

## UI/UX Refactoring: EmployeeSelector og CarSelector

### Oversigt

Transformerer begge dropdown-selectors til et rent, moderne design med bedre visuelt hierarki, reduceret farvebrug, og luftigere layout.

---

### Trin 1: EmployeeSelector refactoring

**`src/components/Planner/EmployeeSelector.tsx`**

**Layout-aendringer per raekke:**
- Venstre: Checkbox (uaendret)
- Midte: Navn med `font-medium text-foreground`, under navnet en `text-xs text-muted-foreground` linje med afstand (f.eks. "MapPin 8,5 km vaek") i stedet for groen badge
- Hoejre: Kun badges til kritiske advarsler ("Fuldt booket", "Expired", "Terminated")
- Fravaerende/on-leave: Hele raekken faar `opacity-60` i stedet for separate badges

**Styling:**
- Raekke-padding: `py-3 px-4` (luftigere)
- Hover: `hover:bg-accent/50` (lys, neutral)
- Valgt raekke: `bg-accent/30` (ingen blaa/roed border-l)
- Separator: `border-b border-border/40` mellem raekker
- Fjern `!bg-red-50 !border-l-4 !border-red-600` styling — brug i stedet en diskret badge for "Fuldt booket"

**Proximity-visning (ny):**
```text
Foer:  [Groen Badge: "Naermeste (8,4 km)"]
Efter: Under navnet: "MapPin 8,5 km vaek" i text-xs text-muted-foreground
```

---

### Trin 2: CarSelector refactoring

**`src/components/Planner/CarSelector.tsx`**

**Layout-aendringer per raekke:**
- Venstre: `Car`-ikon fra lucide-react i ensartet `text-muted-foreground` farve
- Midte: Bilnavn med `font-medium`, nummerplade som `text-xs text-muted-foreground` sub-tekst under navnet
- Hoejre: Kun badge for "I brug hele dagen" eller "Utilgaengelig"

**Styling:**
- Raekke-padding: `py-3 px-4`
- Hover: `hover:bg-accent/50`
- Valgt raekke: `bg-accent/30` (ingen blaa border-l)
- Separator: `border-b border-border/40`
- Fjern roed border-l og roed baggrund — brug diskret badge i stedet
- Fjern "Valgt" badge — den aktive raekke vises via baggrundsfarveskift

---

### Trin 3: Opdater design-system dokumentation

**`docs/ui-guidelines/design-system.md`**

Tilfoej en ny sektion "List Item komponenter" med retningslinjer:

```text
### List Item (Dropdown/Selector)

Standardmoenstre for listevisning i dropdowns og selectors.

Klasser:
- Raekke: py-3 px-4, border-b border-border/40
- Hover: hover:bg-accent/50, transition-colors
- Valgt: bg-accent/30
- Disabled: opacity-60, cursor-not-allowed
- Navn: font-medium text-foreground
- Sub-tekst: text-xs text-muted-foreground
- Badges: Kun til kritiske statusser (fuldt booket, utilgaengelig)
- Proximity: Vis som sub-tekst med MapPin-ikon, ikke som badge
```

---

### Trin 4: Dokumentation

**`CHANGELOG.md`**: Log UI/UX refactoring af selectors

---

### Filer der aendres

| Fil | Aendring |
|-----|----------|
| `src/components/Planner/EmployeeSelector.tsx` | Nyt layout, proximity som sub-tekst, luftig padding, neutrale farver |
| `src/components/Planner/CarSelector.tsx` | Car-ikon, nummerplade sub-tekst, neutrale farver, fjern roede rammer |
| `docs/ui-guidelines/design-system.md` | Ny "List Item" sektion |
| `CHANGELOG.md` | Dokumenter refactoring |

### Kvalitetstjek

- Ingen hardcoded Tailwind gray-klasser (bruger semantiske tokens: accent, muted-foreground, border)
- Fungerer i baade lys tilstand og med eksisterende tema-variabler
- Proximity-info bevares men vises diskret som sub-tekst
- Kritiske statusser (fuldt booket, utilgaengelig) forbliver synlige via badges
- Fravaer markeres med opacity i stedet for ekstra badges

