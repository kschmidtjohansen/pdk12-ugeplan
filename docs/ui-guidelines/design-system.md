# Design System

> **Stilretning (fase 1+2):** Apple/Arc-inspireret — premium, blød og dataorienteret.
> Fladt look med subtile borders og diskrete skygger. **Ingen** gradients, glow,
> shimmer, hover-lift (`-translate-y`) eller pulse-glow.
> Brand-farver og logo bevares uændret.

---

## 1. Designprincipper

1. **Borders før skygger** — brug `border border-border` som primær afgrænsning. Skygger er kun til at løfte interaktive flader (`shadow-xs` / `shadow-sm`).
2. **Ingen dekorative gradients eller blur-orbs** — kun en flad `bg-card` eller `bg-background`. Tidligere `bg-gradient-to-br from-primary...` headers er fjernet.
3. **Farve sparsomt** — primær accent på CTA-knapper, fokusringe og enkelte ikon-bagrunde (`bg-primary/10 text-primary`). Status-pills bruger neutralt `bg-muted` med farvet ikon kun når statussen er afgørende.
4. **Tæt informationsdensitet** — mindre paddings på chrome (header, toolbar), generøs padding kun inde i kortets indhold.
5. **Animationer er funktionelle** — `transition-colors`, `transition-opacity`. Ingen `animate-fade-in-up`, `animate-pulse-glow` eller `animate-shimmer`.

---

## 2. Designtokens

Alle tokens er HSL-værdier i `src/index.css`. Brug aldrig hardcoded Tailwind-farver (`text-gray-900`, `bg-slate-50`) i komponenter.

### 2.1 Radius

| Token | Værdi | Anvendelse |
|-------|-------|------------|
| `--radius` | `0.625rem` (10px) | Base. `rounded-lg` = 10px, `rounded-xl` = 12px, `rounded-md` = 8px |

Apple/Arc-look: `rounded-xl` på kort og dialoger, `rounded-lg` på toolbars og inputs, `rounded-md` på badges og små pills.

### 2.2 Skygger

| Token | Anvendelse |
|-------|------------|
| `shadow-xs` | Standard kort, paneler, toolbars (default) |
| `shadow-sm` | Hover-tilstand for løftbare kort |
| `shadow-md` | Popovers, dropdowns, kontextmenuer |
| `shadow-lg` | Dialogs, drawers |
| `shadow-xl` | Brug aldrig på chrome — kun til særligt fremhævede elementer |

> ⚠️ Ingen `shadow` (Tailwind default), `shadow-blue-500/40` eller custom glows. Brug kun de fem ovenstående tokens.

### 2.3 Farver

| Token | Tailwind | Anvendelse |
|-------|----------|------------|
| `--background` | `bg-background` | Side-baggrund (lys: `0 0% 99%`, mørk: `222 22% 7%`) |
| `--foreground` | `text-foreground` | Primær tekst |
| `--card` | `bg-card` | Kort-, dialog- og toolbar-baggrund |
| `--muted` | `bg-muted` | Ikon-bagrunde, info-pills, toggle-spor |
| `--muted-foreground` | `text-muted-foreground` | Sekundær tekst, neutrale ikoner |
| `--primary` | `bg-primary`, `text-primary` | CTA, aktive states, brand |
| `--primary/10` | `bg-primary/10` | Subtil accent på header-ikoner |
| `--accent` | `bg-accent` | Hover på rækker og listeelementer |
| `--border` | `border-border` | Alle kanter (brug aldrig `border-gray-200`) |
| `--destructive` | `bg-destructive`, `text-destructive` | Slet, fejl |

### 2.4 Funktionelle status-farver (undtagelse)

Bruges direkte fra Tailwind, da de er semantisk universelle:

| Farve | Anvendelse |
|-------|------------|
| `border-l-emerald-500` | Publiceret opgave (venstrekant på AssignmentCard) |
| `border-l-amber-400` / `bg-amber-500` | Ikke-publiceret, lager-indikator |
| `text-destructive` | Fejl (brug token, ikke `text-red-500`) |

Undgå generelt `text-blue-600`, `bg-purple-50`, `text-yellow-600` — brug `text-primary` eller `text-muted-foreground`.

---

## 3. Standardmønstre for komponenter

### 3.1 Side-layout

```tsx
<div className="min-h-screen w-full bg-background">
  <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-5 space-y-4">
    <PageHeader title="..." description="...">
      <Button size="sm">...</Button>
    </PageHeader>

    <div className="rounded-xl border border-border bg-card shadow-xs">
      {/* indhold */}
    </div>
  </div>
</div>
```

**Regler:**
- Side-baggrund er altid `bg-background`. Ingen `bg-[#f8fafc]` eller `bg-slate-50` direkte i JSX.
- Brug `<PageHeader>` på alle sider for konsistens (titel, beskrivelse, action-knapper).
- Indholdscontainere er `rounded-xl border border-border bg-card shadow-xs`.

### 3.2 Kort (`Card`)

| Tilstand | Klasser |
|----------|---------|
| Default | `rounded-xl border border-border bg-card shadow-xs` |
| Hover (klikbart) | `hover:bg-accent/40 transition-colors duration-150` |
| Status-stripe | `border-l-2 border-l-emerald-500` (publiceret) / `border-l-amber-400` (kladde) |

> ❌ Brug ikke `hover:bg-blue-50/50`, `hover:shadow-xl` eller `hover:-translate-y-1`.

### 3.3 Knapper

| Variant | Anvendelse |
|---------|------------|
| `default` | Primær CTA (1 pr. visning) |
| `outline` | Sekundær handling, navigation, view-toggles |
| `ghost` | Icon-only knapper, week-navigation pile |
| `destructive` | Slet-bekræftelse |

Standard-størrelse er `size="sm"` (h-9). Brug `h-7` eller `h-8` for tæt-pakkede toolbars.

### 3.4 Ikon-pills (icon-i-baggrund)

Standardmønster i AssignmentDetails, dashboard-widgets og dialog-rækker:

```tsx
<div className="p-1.5 rounded-md bg-muted text-muted-foreground">
  <Clock className="h-3.5 w-3.5" />
</div>
```

> ❌ Tidligere mønster (`bg-green-50 border border-green-200` med `text-green-600`) er udfaset — det skabte for meget farvet støj.

### 3.5 Header-ikon (page-niveau)

```tsx
<div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
  <Clock className="h-4 w-4" />
</div>
```

Brug `bg-primary/10` (ikke `bg-primary` eller `bg-gradient-to-br`) som subtil brand-accent.

### 3.6 Toolbar / segmenteret kontrol

```tsx
<div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1 py-1">
  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">…</Button>
</div>

<ToggleGroup className="bg-muted rounded-lg p-0.5">
  <ToggleGroupItem className="h-7 px-2.5 data-[state=on]:bg-background data-[state=on]:shadow-xs">…</ToggleGroupItem>
</ToggleGroup>
```

### 3.7 Dialog

- Header: `bg-card border-b` (ikke `bg-gradient-to-b from-muted/30`).
- Body: scrollable inner div, fixed header/footer.
- Indholdsrækker: `p-3 rounded-lg border border-border bg-muted/40` med `text-muted-foreground` ikon.

### 3.8 Badges

- `variant="outline"` med `font-normal` for almindelige labels (biler, medarbejdere).
- `variant="secondary"` for neutrale tags.
- Status-badges via `<StatusBadge />` komponent.

### 3.9 Tom tilstand

Brug altid `<EmptyState>`:
```tsx
<EmptyState icon={<CalendarX2 className="h-12 w-12 text-muted-foreground" />}
            title="Ingen opgaver" description="..." />
```

---

## 4. Visningstyper (Standard / Kompakt / Gitter)

Alle listebaserede sider understøtter 3 visningstyper. Komponenter skal fungere korrekt i alle tre.

| Visning | Brug |
|---------|------|
| **Standard** | Fuld kortvisning. Default på mobil/tablet og planlæggeren. |
| **Kompakt** | Tæt tabel-layout med icon-actions. Default på desktop-lister (Medarbejdere, Biler, Lager). |
| **Gitter** | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, `line-clamp-3` på beskrivelser. |

State persisteres i `localStorage` under `plannerViewMode`.

---

## 5. Spacing-skala

| Kontekst | Klasse |
|----------|--------|
| Side-padding | `px-4 sm:px-6 lg:px-8 xl:px-12 py-5` |
| Sektion-mellemrum (lodret) | `space-y-4` |
| Kort-padding | `p-4` (mobil) / `p-6` (desktop) |
| Kompakt række | `py-2 px-3` |
| Tom-tilstand inde i kort | `py-12` |
| Grid gap | `gap-4` |

---

## 6. Typografi

| Element | Klasser |
|---------|---------|
| Side-titel (H1) | `text-xl font-semibold tracking-tight text-foreground` |
| Side-beskrivelse | `text-sm text-muted-foreground leading-relaxed` |
| Kort-titel | `font-medium text-sm text-foreground` |
| Sektion-label | `text-xs font-semibold text-muted-foreground uppercase tracking-wider` |
| Brødtekst | `text-sm text-foreground` |
| Sekundær tekst | `text-sm text-muted-foreground` |
| Tabular tal (tider, beløb) | `tabular-nums` |
| Kode/mono | `bg-muted text-foreground px-2 py-1 rounded text-xs font-mono` |

---

## 7. Breakpoints

Mobile-first med Tailwind.

| Breakpoint | Bredde |
|------------|--------|
| Default | < 768px |
| `md:` | ≥ 768px |
| `lg:` | ≥ 1024px |
| `xl:` | ≥ 1280px |

Aktuel preview-bredde for design-review: 1212×825 (skal teste både `md` og `lg`).

---

## 8. Mørk tilstand

Polishet sammen med lys tilstand i fase 1. Tokens kalibreret så `--background = 222 22% 7%` og skygger er stærkere (`rgb(0 0 0 / 0.30-0.60)`) for at opretholde dybde uden at virke "sort hul".

Test altid begge temaer for nye komponenter — særligt kontrast mellem `bg-card` og `bg-muted` samt borders.

---

## 9. Anti-patterns (forbudt)

| ❌ Brug ikke | ✅ Brug i stedet |
|-------------|------------------|
| `bg-gradient-to-br from-primary...` | `bg-card` + `bg-primary/10` på ikon |
| `bg-[#f8fafc]` / `bg-slate-50` | `bg-background` |
| `text-blue-600`, `text-purple-600` | `text-primary` / `text-muted-foreground` |
| `bg-green-50 border-green-200` (icon-pill) | `bg-muted text-muted-foreground` |
| `hover:-translate-y-1` | `hover:bg-accent/40 transition-colors` |
| `animate-fade-in-up`, `animate-pulse-glow`, `animate-shimmer` | Ingen — ingen entry-animationer på sider |
| `shadow-blue-500/40` | `shadow-xs` / `shadow-sm` |
| `border border-white/30 backdrop-blur-sm` | `border border-border bg-card` |
| `text-lg font-bold` for side-titel | `text-xl font-semibold tracking-tight` |

---

## 10. Reference-implementationer

Brug disse filer som kanoniske eksempler på det nye look:

| Mønster | Reference |
|---------|-----------|
| Side-layout + PageHeader | `src/pages/CarsPage.tsx`, `src/pages/EmployeesPage.tsx` |
| Planner-header (toolbar+toggle) | `src/pages/PlannerPage.tsx` |
| AssignmentCard (status-stripe) | `src/components/Planner/AssignmentCard.tsx` |
| Icon-pills i detaljer | `src/components/Planner/AssignmentDetails.tsx` |
| Dialog (clean header + rækker) | `src/components/Dashboard/AssignmentDetailsDialog.tsx` |
| Base-komponenter | `src/components/ui/{button,card,dialog,input,badge}.tsx` |
