## Mål
Alle dashboard-kortheaders skal se ens ud: samme tynde `border-b`, samme titel-typografi og samme blå `brand-dot` foran titlen. Den nuværende dekorative blå gradient + `border-top` på `.brand-card-header` fjernes til fordel for én neutral standard.

## Ændringer

### 1. `src/index.css` — omdefinér `.brand-card-header`
Erstat gradient + `border-top` med en enkel, ensartet header-stil:

```css
.brand-card-header {
  border-bottom: 1px solid hsl(var(--border) / 0.7);
  padding-bottom: 0.75rem;
  background: transparent;
}
```

`.brand-dot` bevares uændret (6px blå prik foran titel).

### 2. Standardisér alle dashboard-headers
Mønster der anvendes konsekvent:

```tsx
<CardHeader className="brand-card-header">
  <CardTitle className="text-sm font-semibold brand-dot">
    {title}
  </CardTitle>
</CardHeader>
```

Filer der opdateres:
- `WeeklyAssignments.tsx` — allerede `brand-card-header` + `brand-dot`; opdaterer kun hvis stilen afviger.
- `AutoPublishLogWidget.tsx` — tilføj `brand-card-header` + `brand-dot`.
- `ServicemedarbejderDashboard.tsx` — tilføj `brand-card-header` + `brand-dot`, fjern `pb-2`.
- `UpcomingVacationsWidget.tsx` — tilføj `brand-card-header` + `brand-dot`.
- `DutySummaryWidget.tsx` — tilføj `brand-card-header` + `brand-dot`, behold uppercase-tracking-stil.
- `MineOpgaver.tsx` — 4 CardHeader-instanser får `brand-card-header` + `brand-dot` på titel.
- `VacationNotificationsPanel.tsx` — wrap titel-rækken i en div med `brand-card-header` (bruger `<h3>`, ikke Card).
- `CompactKpiStack.tsx` — sektionstitler får tilsvarende `border-b` wrapper hvis de fungerer som header.

### 3. Ingen ændringer
- `WelcomeHeader.tsx` (page-level hero, ikke et kort).
- `StatusTimeline.tsx` (interne `<h4>`-sektioner, ikke kortheader).
- `QuickAccessGrid.tsx` (tile-tekster, ikke header).
- Ingen ændringer i logik, oversættelser eller komponentstruktur.

## Resultat
- Alle dashboard-kort har samme tynde nederste streg under titlen — ingen blå gradient, ingen top-streg.
- Alle titler indledes med samme blå brand-dot.
- Konsistent visuel rytme på tværs af kort uden dekorative accenter.