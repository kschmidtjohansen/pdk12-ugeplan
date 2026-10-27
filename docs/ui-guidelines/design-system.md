# Design System

> **Stilretning (v1.2 — "Nordic Operations"):** Professionelt, nordisk
> operationsværktøj. Fladt look med subtile borders, diskrete skygger,
> redaktionelt informationshierarki og disciplineret 8px-spacing.
> **Ingen** gradients, glow, shimmer, glas-effekter, hover-lift
> (`-translate-y`) eller pulse-glow. Brand-farver (#00AEEF) og det
> officielle Polygon-logo bevares uændret. Produktnavnet er **PolyPlan**;
> Polygon er organisationen/afsenderen.

## v1.2-ændringer (før/efter)

| Før | Efter |
|-----|-------|
| `login-ambient-glow` + `login-dot-pattern` (glow/dot-grid) | **Fjernet.** Login er nu en flad 2-kolonne komposition: mørkt brand-panel (`bg-brand-deep`) + roligt form-panel |
| `brand-card-header` med brand-gradient | Flad header med kun `border-bottom` — samme klasse, ingen gradient |
| `brand-dot` med glød-ring (`box-shadow`) | Stille brand-tick: 3px lodret streg i `--primary` |
| `brand-card-hover` med `translateY(-1px)`-lift | Kun border- og skygge-overgang (`shadow-sm`), ingen bevægelse |
| `brand-surface` med gradient | Flad `bg-card` |
| `btn-premium-inset` | Udfaset — brug ikke i ny kode |
| `bg-card/70 backdrop-blur` på dashboard-flader | Flad `bg-card shadow-xs` |
| "Polygon Ugeplan" i sidebar/manifest/metadata | "PolyPlan" (organisationsnavnet Polygon bevares) |

### Nye tokens (v1.2)

| Token | Tailwind | Anvendelse |
|-------|----------|------------|
| `--brand-ink` | `text-brand-ink` | Tekst/ikoner OVEN PÅ brand-blå flader (AA-kontrast, da hvid på #00AEEF er for svag) |
| `--brand-deep` | `bg-brand-deep` | Mørk brand-flade (login brand-panel) |
| `--brand-deep-foreground` | `text-brand-deep-foreground` | Tekst på `brand-deep` |
| `--brand-deep-muted` | `text-brand-deep-muted` | Sekundær tekst på `brand-deep` |

### Produktidentitet

Brugerrettet produktnavn er altid **PolyPlan** — hent det fra
`src/config/product.ts` (`PRODUCT_NAME`, `ORG_NAME`, `PRODUCT_TAGLINE_DA`)
i stedet for at hardcode strenge. Det officielle Polygon-logo
(`src/assets/polygon-mark.png` og polygon-logo.svg) bruges uændret;
opfind eller hent aldrig alternative logoer.

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
| `--radius` | `0.625rem` (10px) | Legacy base preserved; shared controls use `rounded-md` (8px), shared Card uses `rounded-lg` |

Legacy radius mapping: `rounded-xl` på kort og dialoger, `rounded-lg` på toolbars og inputs, `rounded-md` på badges og små pills.

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

Statusfarver skal også bruge semantiske tokens:

| Farve | Anvendelse |
|-------|------------|
| `border-l-success` | Publiceret opgave (venstrekant på AssignmentCard) |
| `border-l-warning` / `bg-warning` | Ikke-publiceret, lager-indikator |
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

## Farveregel og sagshierarki (2026-09-26)
- Brug kun semantiske tokens (success, warning, destructive, info, muted, primary, foreground/background). Ingen `text-red-500`, `bg-white` o.l. og ingen `dark:`-farveoverrides. Undtagelser: kioskvisning, billedbeskærer.
- Sagshierarki: `CaseNumber` (sagsnummer, lille/mono/dæmpet) → titel (fed, foreground) → beskrivelse/adresse (muted, højst 2 linjer).


## v1.2.1 — den indloggede arbejdsflade

v1.2 ændrede hovedsageligt login; v1.2.1 ændrer den faktiske navigation og dashboard-komposition. Login, hooks, rettigheder, filtre og handlers er ikke ombygget.

| Før | Efter |
|---|---|
| Icon-only desktop som standard | Expanded 224px navigation; collapse-toggle bevaret; afdeling med tekst og eksisterende selector |
| 44px kompakt topbar med tætpakkede actions | Todelt arbejdsheader: sidetitel/profil/notifikationer, separat søge-/værktøjsrække uden skjulte actions |
| Mobil ikoner med tynd topmarkering | 64px bottom-nav, aktiv flade og brandstreg, Mere med aria-expanded |
| Velkomstkort med vandret pill-scroll | Åben velkomstsektion, separat søgning/actions og responsivt status-grid |
| 2/3 + 1/3 ens kort | Primær arbejdsflade og 280px operationelt rail ved xl; på smal laptop stables rail |
| KPI med farvet ikonboks og små tal | Label, stort tabular tal/total og tilgængeligt navngivet action-scorecard |
| Prikket tidslinje og pulserende status | Tidskolonne, titel/status, adresse og ressourcekolonner; ingen pulse eller nedsat tekstkontrast |
| Ugekort i kort med hover-only menu | Åben kontrolsektion, 44px dagsfiltre og divider-liste; altid synlig redigér/slet-menu |
| Ens ferie-/vagtkort med avatar-dekoration | Konsistente rail-sektioner med dividers og læsbare person-/datorækker |
| Gradient/inset brandknap | Flade default/brand-varianter, neutral outline, border-faner og semantiske statusbadges |

### Kontrakt og brug

- `.operations-shell` scoper kontrast og exact #00AEEF til den indloggede app; login beholder sine tokens. Portals beholder globalt tema og skal kontrolleres separat.
- Spacing: 4px interne detaljer, 8px kontrolgap, 16px række-/sektionspadding, 24px mellem hovedflade og rail.
- Primære controls: 44px på mobil; tætte desktop-knapper kan bruge eksisterende sm-variant. Header, mobilmenu, dagsfiltre og kontaktknapper bruger mindst 44px.
- Tabs bruger Radix state og keyboard navigation; visuel aktiv tilstand er underline + foreground + neutral surface, aldrig kun farve.
- Badge `gradient` er et bagudkompatibelt variantnavn, men tegnes fladt. Alle props/variantnavne bevares.
- `Button loading` blokerer klik og eksponerer aria-busy. Icon-only actions skal have aria-label.
- Brug ikke Card rundt om rail-sektioner eller arbejdsflader; Card er til individuelle indrammede elementer.

```tsx
<section className="border-b border-border pb-4">
  <header className="border-b border-border pb-3 mb-4">
    <h3 className="text-sm font-semibold">...</h3>
  </header>
  <Button variant="ghost" className="min-h-11 whitespace-normal" onClick={existingHandler}>...</Button>
</section>
```

### QA og dokumenterede begrænsninger

- Kontrollerede komponentfixtures: tidslinje, KPI og ferie-rail ved 360/390/768/1280px i light/dark; ingen horisontal page-overflow. Screenshots er testdata, **ikke autentificerede skærme**.
- Komponenttests kontrollerer menu-open, duty-featureflag, dialogåbning og loading-knapper; eksisterende create/edit/delete/undo-tests bevares.
- Browser på /dashboard redirecter til /login. Ekstern unmanaged Supabase giver ingen test-session; autentificeret fuld dashboard/navigation/planner og reelle data er derfor ikke visuelt eller end-to-end verificeret.
- WCAG AA er et mål, ikke en certificering. Fokus/reduced-motion og konkrete kontrolmål er kontrolleret; komplet kontrastaudit af alle legacy views/portals er ikke udført.


## v1.3 — operationelle ugehandlinger

| Før | Efter |
|---|---|
| Ugevalg og søgning uden fælles statusindblik | Ugens plan: opgaver, kladder, uden medarbejdertilknytning, opgaver med overlap |
| Indikatorer uden handoff | Dashboard-link vælger samme ISO-uge og statusfilter på /planner |
| Filtreret tom liste kaldt tom uge | Resultattal, ingen-match og samlet ryd-handling |
| Dage foldet sammen selv når et issue vælges | Matching dage udvides; dag-navigation og Denne uge |
| Beregning/queries gentaget per kort | Parent-week context og fallback for standalone kort |

### Kontrakter
- `summarizeWeek` modtager den fulde allerede autoriserede uge; aldrig den tekst-/medarbejderfiltrerede liste. `computeConflicts` forbliver eneste overlapregel. Label er **opgaver med overlap**, ikke antal konflikter/par.
- `filterPlannerAssignments` kombinerer status, tekst, employee og dag med AND; postnummer er fortsat nærhedsrangering, ikke et geografisk opgavefilter.
- `WeekOperationsStrip` er read-only: `onSelect` filtrerer eller navigerer, ingen skjulte mutationer. Neutral medarbejdertilknytning, ingen påstand om universelt krav eller automatisk driftsklarhed.
- Linkformat: `plannerOperationsLink(week, isoYear, issue)`; parseren afviser ugyldig uge 53. Eksisterende localStorage for view og uge bevares.
- `PlannerWeekDataProvider` omkring planner-content deler fuld uge og overlap; cards uden provider beholder eksisterende fallback. Availability bruger den ufiltrerede uge og eksisterende ferie/kursus/crossBusy-kilder.
- Kalenderens lane-valg bevares; aktivt filter suppleres med åbnbar resultatliste, så uden-medarbejder-opgaver ikke forsvinder.
- Alle nye mobilkontroller mindst 44px; filtre inline frem for sticky/overlay. Status bruger både label, tal og pressed-state; konfliktstatus ikke kun farve.

```tsx
const summary = useMemo(() => summarizeWeek(weekAssignments, employees, cars), [weekAssignments, employees, cars]);
<WeekOperationsStrip summary={summary} week={selectedWeek} active={issue} onSelect={selectIssue} />
```

### QA-begrænsning
111 automatiske tests er bestået; responsive header/status/dag-navigation-fixtures kontrolleret ved 360/390/768/1280/1440 i light/dark uden page-overflow. Fokus-ring/reduced-motion kontrolleret. Listeviews i fixtures er mockede; ikke autentificerede skærme og ikke før/efter-screenshots med live data. Ekstern Supabase-session er unmanaged; fuld indlogget planner/dashboard/CRUD/PWA og samlet WCAG 2.2 AA-certificering er ikke verificeret. Ingen deploy udført.

## Design System 2.0 (punkt 4.5)

Gentagelige mønstre — brug disse frem for egen markup:

| Mønster | Komponent | Regel |
|---|---|---|
| Sidehoved | `Layout/PageHeader` (`eyebrow`, `meta`, actions som children) | Afdeling som eyebrow, resultattal som `meta` med tabular-nums; handlinger wrapper på 360px; knapper `min-h-11`. |
| Listeside | `shared/ListPageShell` (videregiver `eyebrow`/`meta`) | Ét filterBar-slot, ét indholdsområde. |
| Filtre | `shared/ModuleListTools` / `SegmentedFilterBar` | Aktive filtre kan altid nulstilles; "Viser X af Y". |
| Arbejdsflade | `shared/WorkspaceSection` (ny) | Flad sektion: titel + meta + actions over en divider, `aria-labelledby`. Ingen indlejrede kort. |
| Tom | `shared/EmptyState` (`variant: empty \| filtered`, `compact`) | `filtered` = data findes men skjules → outline "Ryd filtre". `role="status"`. |
| Fejl | `shared/ErrorState` | Altid adskilt fra tom/loading; retry-knap når muligt. |
| Loading | `shared/ListSkeleton` | Aldrig tom-tekst mens data hentes. |
| Status | `ui/status-badge` (`dot`) | Farve suppleres altid af tekst; `data-status` til tests. Ukendt = `default`, aldrig `success`. |

Anvendt i: Admin → Driftscenter, Vagtplan (PageHeader med afdeling/antal, EmptyState), Lager (antal i header, filtreret tom-tilstand med Ryd filtre / Tilføj), Biler (antal i header, filtreret tom-tilstand).
