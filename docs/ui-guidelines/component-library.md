# Component Library

Oversigt over alle genbrugelige komponenter i `src/components/shared/` og `src/components/ui/`.

---

## Shared-komponenter (9 stk)

Projektspecifikke komponenter til genbrug på tværs af sider.

### EmptyState
**Sti:** `src/components/shared/EmptyState.tsx`

Standardiseret tom-tilstand med ikon, titel, beskrivelse og valgfri action-knap.

```tsx
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;        // Default: AlertCircle (h-12 w-12)
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Anvendelse:**
```tsx
<EmptyState
  title="Ingen opgaver"
  description="Der er ingen opgaver for denne dag."
  icon={<CalendarX2 className="h-12 w-12 text-muted-foreground" />}
  action={{ label: "Opret opgave", onClick: handleCreate }}
/>
```

**UI-guideline:** Følger tom-tilstands-standarden med `py-12`, `text-foreground` for titel, `text-muted-foreground` for beskrivelse.

---

### CardSkeleton
**Sti:** `src/components/shared/CardSkeleton.tsx`

Loading-skeleton for kort-baserede layouts.

```tsx
interface CardSkeletonProps {
  count?: number;  // Default: 1
}
```

**Anvendelse:**
```tsx
{isLoading ? <CardSkeleton count={3} /> : <CardList />}
```

---

### TableSkeleton
**Sti:** `src/components/shared/TableSkeleton.tsx`

Loading-skeleton for tabel-layouts.

```tsx
interface TableSkeletonProps {
  rows?: number;     // Default: 5
  columns?: number;  // Default: 4
}
```

**Anvendelse:**
```tsx
{isLoading ? <TableSkeleton rows={10} columns={6} /> : <DataTable />}
```

---

### MetricsSkeleton
**Sti:** `src/components/shared/MetricsSkeleton.tsx`

Loading-skeleton for dashboard-metrics (grid-layout).

```tsx
interface MetricsSkeletonProps {
  count?: number;  // Default: 4
}
```

**Anvendelse:**
```tsx
{isLoading ? <MetricsSkeleton count={4} /> : <DashboardMetrics />}
```

**Layout:** `grid gap-4 md:grid-cols-2 lg:grid-cols-4` med `rounded-lg border bg-card p-6`.

---

### LoadingSpinner
**Sti:** `src/components/shared/LoadingSpinner.tsx`

Generisk loading-indikator med valgfri besked.

```tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';  // Default: 'md'
  message?: string;
}
```

**Anvendelse:**
```tsx
<LoadingSpinner size="lg" message="Indlæser data..." />
```

---

### RouteLoadingFallback
**Sti:** `src/components/shared/RouteLoadingFallback.tsx`

Loading-komponent til lazy-loadede routes. Viser centreret spinner med gradient-baggrund.

```tsx
// Ingen props — self-contained komponent
```

**Anvendelse:**
```tsx
<Suspense fallback={<RouteLoadingFallback />}>
  <LazyPage />
</Suspense>
```

---

### LastRefreshIndicator
**Sti:** `src/components/shared/LastRefreshIndicator.tsx`

Viser tidspunkt for seneste data-opdatering med refresh-knap.

```tsx
interface LastRefreshIndicatorProps {
  lastRefresh: Date | null;
  isRefreshing?: boolean;   // Default: false
  onRefresh?: () => void;
}
```

**Anvendelse:**
```tsx
<LastRefreshIndicator
  lastRefresh={lastFetched}
  isRefreshing={isFetching}
  onRefresh={() => refetch()}
/>
```

**Styling:** `rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground` — bruger `date-fns` med dansk locale.

---

### PullToRefresh
**Sti:** `src/components/shared/PullToRefresh.tsx`

Pull-to-refresh wrapper til mobile listevisninger. Kun aktiv på mobil.

```tsx
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;  // Default: false
}
```

**Anvendelse:**
```tsx
<PullToRefresh onRefresh={async () => await refetch()}>
  <EmployeeList />
</PullToRefresh>
```

**Adfærd:** 80px pull-threshold, viser spinner og dansk tekst ("Træk ned" / "Slip for at opdatere" / "Opdaterer...").

---

### RealtimeChangeNotifier
**Sti:** `src/components/shared/RealtimeChangeNotifier.tsx`

Toast-notifikation ved realtime-ændringer fra andre brugere. Lytter på 6 tabeller.

```tsx
// Ingen props — self-contained komponent
// Lytter på: assignments, cars, warehouse_items, profiles, on_call_duties, vacations
```

**Anvendelse:**
```tsx
// Placeret globalt i MainLayout
<RealtimeChangeNotifier />
```

**Adfærd:** Viser blå banner med "Opdater"-knap. Suppresser egne handlinger i 3 sekunder. Deaktiveret i demo-mode.

---

## UI-komponenter (51+ stk)

Radix UI-baserede primitiver i `src/components/ui/`. Alle følger shadcn/ui-mønsteret med `class-variance-authority` variants.

### Radix UI Primitiver

| Komponent | Fil | Beskrivelse |
|-----------|-----|-------------|
| Accordion | `accordion.tsx` | Sammenfoldeligt indhold |
| AlertDialog | `alert-dialog.tsx` | Bekræftelses-dialog |
| Alert | `alert.tsx` | Statusbeskeder |
| AspectRatio | `aspect-ratio.tsx` | Aspektforhold-container |
| Avatar | `avatar.tsx` | Bruger-avatar med fallback |
| Badge | `badge.tsx` | Status-labels |
| Breadcrumb | `breadcrumb.tsx` | Navigation-breadcrumbs |
| Button | `button.tsx` | Primær knap med variants |
| Calendar | `calendar.tsx` | Datovælger (react-day-picker) |
| Card | `card.tsx` | Kort-container |
| Carousel | `carousel.tsx` | Billedkarrusel |
| Chart | `chart.tsx` | Diagram-wrapper (recharts) |
| Checkbox | `checkbox.tsx` | Afkrydsningsfelt |
| Collapsible | `collapsible.tsx` | Sammenfoldeligt panel |
| Command | `command.tsx` | Kommando-palette (cmdk) |
| ContextMenu | `context-menu.tsx` | Højreklik-menu |
| Dialog | `dialog.tsx` | Modal dialog |
| Drawer | `drawer.tsx` | Bottom drawer (vaul) |
| DropdownMenu | `dropdown-menu.tsx` | Dropdown-menu |
| Form | `form.tsx` | Formular med react-hook-form |
| HoverCard | `hover-card.tsx` | Hover-popup |
| InputOTP | `input-otp.tsx` | OTP-input |
| Input | `input.tsx` | Tekst-input |
| Label | `label.tsx` | Formular-label |
| Menubar | `menubar.tsx` | Menu-bar |
| NavigationMenu | `navigation-menu.tsx` | Navigation |
| Pagination | `pagination.tsx` | Side-navigation |
| Popover | `popover.tsx` | Popup-panel |
| Progress | `progress.tsx` | Fremskridts-bar |
| RadioGroup | `radio-group.tsx` | Radio-knapper |
| Resizable | `resizable.tsx` | Resizable panels |
| ScrollArea | `scroll-area.tsx` | Scrollbar-container |
| Select | `select.tsx` | Dropdown-select |
| Separator | `separator.tsx` | Visuel separator |
| Sheet | `sheet.tsx` | Side-panel |
| Sidebar | `sidebar.tsx` | Sidebar-navigation |
| Skeleton | `skeleton.tsx` | Loading-placeholder |
| Slider | `slider.tsx` | Skyder |
| Sonner | `sonner.tsx` | Toast-notifikationer |
| Switch | `switch.tsx` | Toggle-switch |
| Table | `table.tsx` | Tabel-komponenter |
| Tabs | `tabs.tsx` | Tab-navigation |
| Textarea | `textarea.tsx` | Tekst-område |
| Toast | `toast.tsx` | Toast-besked |
| Toaster | `toaster.tsx` | Toast-container |
| ToggleGroup | `toggle-group.tsx` | Toggle-gruppe |
| Toggle | `toggle.tsx` | Toggle-knap |
| Tooltip | `tooltip.tsx` | Hover-tooltip |

### Projektspecifikke UI-komponenter

| Komponent | Fil | Beskrivelse |
|-----------|-----|-------------|
| PasswordInput | `password-input.tsx` | Password med show/hide og styrke-indikator. Props: `showStrengthIndicator`, `onValidationChange` |
| SecureInput | `secure-input.tsx` | Input med automatisk sanitering, e-mail validering, password-styrke. Props: `sanitize`, `validateEmail`, `validatePasswordStrength` |
| Spinner | `spinner.tsx` | Simpel loading-spinner |
| StatusBadge | `status-badge.tsx` | Farvekodet status-badge |

---

## Anvendelsesprincipper

### Loading-states
Brug altid den passende skeleton:
- **Kort-layout** → `CardSkeleton`
- **Tabel-layout** → `TableSkeleton`
- **Dashboard-metrics** → `MetricsSkeleton`
- **Enkelt loading** → `LoadingSpinner`
- **Route-loading** → `RouteLoadingFallback`

### Tomme tilstande
Brug altid `EmptyState` med:
- Relevant ikon fra `lucide-react`
- Kort, beskrivende titel
- Valgfri beskrivelse og action-knap
- Følg UI-guidelines: `py-12`, `text-foreground`, `text-muted-foreground`

### Mobile
- Brug `PullToRefresh` wrapper på alle listevisninger
- Brug `useIsMobile()` hook til at skifte mellem tabel og kort-visning

### Realtime
- `RealtimeChangeNotifier` placeres globalt i `MainLayout`
- `LastRefreshIndicator` vises på sider med data-fetching
