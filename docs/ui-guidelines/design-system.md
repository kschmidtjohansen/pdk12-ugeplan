# Design System

## Visningstyper

Alle listebaserede sider understøtter 3 visningstyper. Komponenter skal fungere korrekt i alle tre.

### Standard (Kortvisning)

Fuld kortvisning med alle detaljer synlige.

```
Klasser:
- Kort: shadow-sm, rounded-xl, border-border, p-4 (mobil) / p-6 (desktop)
- Titel: text-foreground, font-semibold
- Beskrivelse: text-muted-foreground, text-sm
- Status-badges: Brug <StatusBadge /> komponent
- Hover: hover:shadow-md, transition-all
```

**Anvendelse**: Standard på mobil og tablet. Desktop default for planlæggersiden.

### Kompakt (Tabelvisning)

Tæt tabel-layout med reduceret padding og hover-actions.

```
Klasser:
- Rækker: border-border, hover:bg-muted/50
- Celle-padding: py-2 px-3
- Tekst: text-sm, text-foreground
- Headers: text-muted-foreground, font-medium, text-xs uppercase tracking-wide
- Actions: Vises som icon-buttons (h-8 w-8 p-0) med tooltips
```

**Anvendelse**: Desktop listevisninger (medarbejdere, biler, lager).

### Gitter (Grid)

Responsivt grid med kortfattede kort.

```
Klasser:
- Container: grid gap-4, grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Kort: Som Standard, men med line-clamp-3 på beskrivelser
- Ingen hover-shadow på mobil (touch-venligt)
```

**Anvendelse**: Planlæggersiden (valgfri), dashboard-widgets.

---

## Farve-tokens (Semantiske variabler)

Alle farver refereres via CSS-variabler defineret i `src/index.css`. Brug **aldrig** hardcoded Tailwind-farver som `text-gray-900` i komponenter.

### Primære tokens

| Token | Tailwind-klasse | Anvendelse |
|-------|----------------|------------|
| `--background` | `bg-background` | Side-baggrund |
| `--foreground` | `text-foreground` | Primær tekst |
| `--card` | `bg-card` | Kort-baggrund |
| `--card-foreground` | `text-card-foreground` | Tekst i kort |
| `--primary` | `bg-primary`, `text-primary` | Primære handlinger, aktive elementer |
| `--primary-foreground` | `text-primary-foreground` | Tekst på primær baggrund |
| `--secondary` | `bg-secondary` | Sekundære handlinger |
| `--muted` | `bg-muted` | Dæmpede baggrunde, disabled |
| `--muted-foreground` | `text-muted-foreground` | Sekundær tekst, labels |
| `--accent` | `bg-accent` | Hover-tilstande |
| `--destructive` | `bg-destructive`, `text-destructive` | Slet-handlinger, fejl |
| `--border` | `border-border` | Alle kanter |
| `--ring` | `ring-ring` | Fokus-ring |

### Funktionelle statusfarver (Undtagelser)

Disse Tailwind-farver bruges direkte, da de er funktionelle og ikke tema-afhængige:

| Farve | Anvendelse |
|-------|------------|
| `text-green-500` / `bg-green-500` | Tilgængelig, aktiv, godkendt |
| `text-red-500` / `bg-red-500` | Utilgængelig, fejl, afvist |
| `text-blue-500` / `bg-blue-50` | Info, detaljer, links |
| `text-orange-500` | Advarsler, trailer-ikon |
| `text-green-600` | Miljøvogn-ikon |

---

## Spacing-skala

| Kontekst | Klasse | Pixels |
|----------|--------|--------|
| Kort-padding (mobil) | `p-4` | 16px |
| Kort-padding (desktop) | `p-6` | 24px |
| Tom tilstand (inden i kort) | `py-8` | 32px |
| EmptyState komponent | `py-12` | 48px |
| Sektion-mellemrum | `space-y-4` | 16px |
| Grid gap | `gap-4` | 16px |
| Side-padding | `px-4 md:px-6` | 16/24px |

---

## Breakpoints

Mobile-first tilgang med Tailwind breakpoints:

| Breakpoint | Bredde | Enhed |
|------------|--------|-------|
| Default | < 768px | Mobil |
| `md:` | ≥ 768px | Tablet |
| `lg:` | ≥ 1024px | Desktop |
| `xl:` | ≥ 1280px | Bred desktop |

### Responsive mønstre

```
Mobil:        MobileCarCard, enkelt-kolonne lister, bottom sheet
Tablet (md):  Grid 2 kolonner, side-by-side layout
Desktop (lg): Tabelvisning, Grid 3 kolonner, fuld navigation
```

---

## Typografi

| Element | Klasser |
|---------|---------|
| Side-titel (H1) | `text-2xl md:text-3xl font-bold tracking-tight text-foreground` |
| Side-beskrivelse | `text-muted-foreground text-sm md:text-base leading-relaxed` |
| Kort-titel | `font-semibold text-foreground` |
| Label/etiket | `text-muted-foreground text-xs uppercase tracking-wide` |
| Brødtekst | `text-sm text-foreground` |
| Sekundær tekst | `text-sm text-muted-foreground` |
| Kode/monospace | `bg-muted text-foreground px-2 py-1 rounded text-xs font-mono` |

---

## Interaktionsmønstre

### Knapper

- Primær: `<Button>` (default variant)
- Sekundær: `<Button variant="outline">`
- Destruktiv: `<Button variant="destructive">`
- Icon-only: `<Button variant="ghost" size="sm" className="h-8 w-8 p-0">` + `<Tooltip>`

### Tomme tilstande

Brug altid `<EmptyState>` komponenten med:
- Ikon (fra lucide-react)
- Titel (`text-foreground`)
- Beskrivelse (`text-muted-foreground`)
- Valgfri action-knap

### Loading

- Lister: `<TableSkeleton />` eller `<CardSkeleton />`
- Dashboard: `<MetricsSkeleton />`
- Routes: `<RouteLoadingFallback />`
- Inline: `<LoadingSpinner />`

### Feedback

- Succes/fejl: `sonner` toast via `toast.success()` / `toast.error()`
- Bekræftelse: `<AlertDialog>` for destruktive handlinger
- Real-time: `<RealtimeChangeNotifier>` for data-opdateringer

---

## List Item (Dropdown/Selector)

Standardmønstre for listevisning i dropdowns og selectors.

```
Klasser:
- Række: py-3 px-4, border-b border-border/40
- Hover: hover:bg-accent/50, transition-colors
- Valgt: bg-accent/30
- Disabled: opacity-60, cursor-not-allowed
- Navn: font-medium text-foreground
- Sub-tekst: text-xs text-muted-foreground
- Badges: Kun til kritiske statusser (fuldt booket, utilgængelig)
- Proximity: Vis som sub-tekst med MapPin-ikon, ikke som badge
```

**Anvendelse**: EmployeeSelector, CarSelector og lignende dropdown-vælgere i formularer.
