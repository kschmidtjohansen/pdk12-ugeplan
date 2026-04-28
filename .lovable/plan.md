## Plan: 9 forbedringer (UX-fixes + UI-overhaul fase 3)

Samlet plan for alle 9 punkter. Funktionalitet bevares, ingen DB-ændringer, ingen brud på multi-tenant-regler. Brand-farver og logo uændret.

---

### 1. Personlig velkomst på login

**Mål:** "Velkommen tilbage" → "Velkommen tilbage, {fornavn}" når en bruger har været logget ind før på enheden.

- I `AuthContext` (efter vellykket `fetchUserData`): gem `localStorage.setItem('last_user_name', user.name)` og `last_user_email`. Ryd ikke ved logout — vi vil have navnet bag forsiden næste gang.
- I `src/pages/LoginPage.tsx`: læs `last_user_name`, ekstrahér fornavn (split på første mellemrum), vis `{t('login.welcomeMessage')}, {firstName}` hvis det findes. Falder tilbage til ren `welcomeMessage` ellers.
- Ingen ny oversættelsesnøgle nødvendig — vi koncatenerer.

### 2. Kun ét øje-ikon i password-felt

**Rod-årsag:** Browser (især Edge/Chrome på Windows) tegner sin egen øje-knap oven i feltet, så brugeren ser to øjne.

**Fix:** Skjul browser-toggle med CSS i `src/index.css`:
```css
input[type="password"]::-ms-reveal,
input[type="password"]::-ms-clear,
input[type="password"]::-webkit-credentials-auto-fill-button { display: none !important; }
```
Berører både `EnhancedSecureLoginForm`, `PasswordInput` og `PasswordResetPage` på én gang. Egen toggle-knap forbliver.

### 3. Smart series-prompt (kun spørg hvis det reelt er en serie)

**Rod-årsag:** I `PlannerPage.handleOpenEditDialog` / `handleDeleteAssignment` udløses `SeriesActionDialog` hvis `assignment.groupId` er sat — også når serien indeholder kun ét element (kan ske efter sletning af søsterdage, eller når legacy-data har samme `case_number` men kun én række).

**Fix:** Skift logik fra "har groupId ELLER >1 sibling" → "har faktisk >1 sibling i datasættet". Konkret i `PlannerPage.tsx`:
- I `handleOpenEditDialog`: erstatte `if (assignment.groupId || siblings.length > 1)` med `if (siblings.length > 1)`.
- Samme i `handleDeleteAssignment`.
- `findSeriesSiblings` returnerer allerede den fulde liste (inkl. `assignment` selv), så `length > 1` er korrekt.
- Resultat: 12-013700 (kun én dag) går direkte til normal edit/delete, multi-day serier viser stadig dialogen.

### 4. Automatisk refresh ved navigation og mutationer (mindre "Opdater"-banner)

**Mål:** Banner fra `RealtimeChangeNotifier` skal kun dukke op ved *eksterne* ændringer fra andre brugere — egen aktivitet og navigation må ikke trigge den.

To koordinerede fixes:

**4a. Side-navigation invalidates cache:**
Ny komponent `RouteChangeRefresher` (eller direkte i `MainLayout`): lyt på `useLocation().pathname`-ændringer og kald `queryClient.invalidateQueries()` for de relevante nøgler (`assignments`, `cars`, `employees`, `vacations`). Frisk data hentes lydløst. Samtidig dispatch `supabase-own-action` for at suppresse banneret i 3 sek.

**4b. Mutationer dispatcher own-action konsekvent:**
Audit alle mutations-stier — i dag dispatchet kun `useAssignmentFiles`. Tilføj `window.dispatchEvent(new Event('supabase-own-action'))` på succes-pathen i:
- `useOptimizedAssignments`: `createAssignment`, `updateAssignment`, `updateSeriesAssignments`, `deleteAssignment`, `deleteAssignmentsByGroupId`, `publishAssignment`, `publishAssignmentsByDate`, `detachFromGroup`.
- `useEmployees`: `createEmployee`, `updateEmployee`, `deleteEmployee`, `toggleEmployeeLeave`.
- `useCars` mutationsfunktioner.
- `useVacations` create/update/delete.
- `useDuty` mutationsstier.

Centraliser via lille hjælper `notifyOwnAction()` i `src/lib/realtimeUtils.ts` for konsistens.

### 5. Bredere CarSelector og EmployeeSelector

I `src/components/Planner/CarSelector.tsx`: `PopoverContent w-80` → `w-[420px] max-w-[calc(100vw-2rem)]`.
I `src/components/Planner/EmployeeSelector.tsx`: `PopoverContent w-96` → `w-[480px] max-w-[calc(100vw-2rem)]`.
Tilføj større min-bredde på rækken så bil-/medarbejdernavne ikke trunkeres for tidligt. Drawer (mobil) er allerede fuldt bred — uændret.

### 6. MainLayout, TopNavbar og PageHeader: nye tokens, fjern backdrop-blur globalt

**MainLayout** (`src/components/Layout/MainLayout.tsx`):
- Fjern `<div className="animate-fade-in-up">` rundt om children — entry-animation på hver navigation føles træg.
- Loading-/redirect-skærmene bruger allerede `bg-background` — bevares.

**TopNavbar** (`src/components/Layout/TopNavbar.tsx`):
- `bg-background/85 backdrop-blur-md border-b border-border` → `bg-background border-b border-border`. Flat, fast, mere Apple/Arc.

**PageHeader** er allerede ren — ingen ændring.

**Globale backdrop-blur fjernes / nedtones:**
- `src/components/ui/dialog.tsx` overlay: `backdrop-blur-[2px]` → fjernes (kun `bg-foreground/40`).
- `src/components/ui/toast.tsx`: kraftig nedrigning — fjern `backdrop-blur-xl`, `shadow-2xl`, `scale-[1.02]`-hover, `border-2`, gradient-`before`. Erstattes med `border border-border bg-card shadow-md rounded-xl p-4 pr-8`.
- `src/components/Cars/FalckSubscriptionButton.tsx`: fjern `bg-white/20 ... backdrop-blur-sm shadow-lg` — brug `variant="outline" size="sm"`.
- `src/components/Planner/AssignmentForm.tsx` sticky footer: `bg-background/95 backdrop-blur` → `bg-background border-t`.
- `src/pages/Index.tsx`, `src/App.tsx`, `src/components/ErrorBoundary/{GlobalErrorBoundary,DashboardErrorBoundary}.tsx`, `src/components/ScreenDisplay/ScreenDisplayErrorBoundary.tsx`: erstat `bg-gradient-to-br from-gray-* to-*` med `bg-background`.
- `src/components/Planner/UnassignedResourcesSection.tsx` + `DutyWeekWidget.tsx` `CardHeader`: `bg-gradient-to-r from-primary/5 to-primary/10` → `bg-muted/40 border-b border-border`.

### 7. Ensret tabel- og formular-styling (Cars, Employees, Duty, Vacation)

Standardiser tre lag:

**Tabel-container** overalt: `rounded-xl border border-border bg-card shadow-xs overflow-hidden` (CarsPage/EmployeesPage har den allerede — udrul til `VacationTable` og `DutyList/DutyCalendar`).

**Tabel-headers** (TableHead): `text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/40 border-b border-border h-10 px-4`.

**Tabel-rækker** (TableRow): `border-b border-border hover:bg-accent/40 transition-colors` — fjern eventuelle eksisterende `hover:bg-blue-50`, `hover:bg-slate-100`, m.m.

**Formular-felter:**
- Allerede konsistent via `Input`-komponenten (`h-9 rounded-lg border-input bg-background`).
- `Label` overalt brug `<Label>` fra ui — gennemgå `EmployeeFormDialog`, `CarFormDialog`, `EnhancedVacationForm`, `DutyAssignmentForm`, `AssignmentFormFields` og fjern eventuelle inline `<label className="text-sm font-medium">` til fordel for komponenten.
- Felt-grupper bruger `space-y-2`, dialog-grids bruger `grid gap-4 md:grid-cols-2`.

Refaktor sker pr. fil — minimal logik-ændring, kun klassenavne.

### 8. Refaktor Button, Input og Card

**Button** (`src/components/ui/button.tsx`): allerede polished, men:
- Fjern `gradient` og `glass` legacy-varianter (de er aliaser i dag — vi sletter for at fjerne fristelsen).
- Tjek alle kald-steder med rg; ingen ramt forventes da de er aliaser. Hvis der er — konverter til `default`/`outline`.
- Bevar `success`/`warning`/`info` (semantiske status-CTA'er).

**Input** (`src/components/ui/input.tsx`): allerede ren — ingen ændring nødvendig.

**Card** (`src/components/ui/card.tsx`): allerede ren (`shadow-xs`). Ingen ændring.

Fokus i pkt. 8 er derfor at *udrydde* gamle rester:
- `EnhancedSecureLoginForm`: `Card className="shadow-lg rounded-xl border-border/50"` → fjern overrides, brug default.
- `ScreenDisplayContent.tsx` Card: `border-2 border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300` → `bg-card border border-border shadow-xs hover:shadow-sm transition-shadow`.
- `ScreenDisplayHeader.tsx`: erstat gradient-banner med ren `bg-card border-b border-border` + `bg-primary/10`-ikon.

### 9. Tokens & globale styling-regler — sidste polish

Tokens (`src/index.css`) og base-stylet er på plads fra fase 1+2. Justeringer:

- Fjern `--gray-25..900` legacy-tokens (de bruges kun i de gradient-baggrunde vi fjerner i pkt. 6). Behold kun semantiske tokens.
- Skriv kort kommentar i toppen af `index.css` der dokumenterer at custom skygger findes som `var(--shadow-xs..xl)` og må bruges via `shadow-xs/sm/md/lg/xl` (allerede mappet i `tailwind.config.ts`).
- Dark mode: gennemgå pkt 6's tunge baggrunde i mørk tilstand for at sikre `bg-background` ser korrekt ud (HSL er allerede kalibreret — kun visuelt tjek).
- Opdater `docs/ui-guidelines/design-system.md` med nye anti-patterns (`backdrop-blur*` på chrome, `bg-gradient-to-br from-gray-*`, `shadow-2xl`, `border-2`).

---

## Tekniske detaljer (samlet)

```text
Filer berørt (estimat ~30):
 ├─ Tokens / globalt CSS
 │   ├─ src/index.css                                  (pwd-eye CSS, ryd legacy gray)
 │   ├─ src/components/ui/dialog.tsx                   (no backdrop-blur)
 │   ├─ src/components/ui/toast.tsx                    (flat redesign)
 │   └─ src/components/ui/button.tsx                   (drop gradient/glass aliases)
 │
 ├─ Punkt 1 — Login greet
 │   ├─ src/context/AuthContext.tsx                    (cache last_user_name)
 │   └─ src/pages/LoginPage.tsx                        (read + interpolate)
 │
 ├─ Punkt 3 — Smart series prompt
 │   └─ src/pages/PlannerPage.tsx                      (logic tweak)
 │
 ├─ Punkt 4 — Auto refresh
 │   ├─ src/lib/realtimeUtils.ts          (NEW, notifyOwnAction helper)
 │   ├─ src/components/Layout/MainLayout.tsx           (route-change invalidator)
 │   ├─ src/hooks/useOptimizedAssignments.ts           (dispatch on all mutations)
 │   ├─ src/hooks/useEmployees.ts
 │   ├─ src/hooks/car/* (mutation hook)
 │   ├─ src/hooks/useVacations.ts
 │   └─ src/hooks/duty/* (mutation hook)
 │
 ├─ Punkt 5 — Selector width
 │   ├─ src/components/Planner/CarSelector.tsx
 │   └─ src/components/Planner/EmployeeSelector.tsx
 │
 ├─ Punkt 6 — Layout cleanup
 │   ├─ src/components/Layout/MainLayout.tsx           (remove fade-in-up wrapper)
 │   ├─ src/components/Layout/TopNavbar.tsx            (flat bg)
 │   ├─ src/pages/Index.tsx, src/App.tsx               (no gradient)
 │   ├─ src/components/ErrorBoundary/Global*, Dashboard*  (no gradient)
 │   ├─ src/components/Cars/FalckSubscriptionButton.tsx
 │   ├─ src/components/Planner/AssignmentForm.tsx      (sticky footer)
 │   ├─ src/components/Planner/UnassignedResourcesSection.tsx
 │   ├─ src/components/Planner/DutyWeekWidget.tsx
 │   └─ src/components/ScreenDisplay/{ScreenDisplayHeader,Content,ErrorBoundary}.tsx
 │
 ├─ Punkt 7 — Tables/forms unified
 │   ├─ src/components/Employees/EmployeesTable.tsx + EmployeeTableRow
 │   ├─ src/components/Cars/CarsTable.tsx
 │   ├─ src/components/Vacation/VacationTable.tsx + VacationList
 │   └─ src/components/Duty/DutyList.tsx + DutyCalendar
 │
 └─ Punkt 8/9 — Final polish
     ├─ src/components/Auth/EnhancedSecureLoginForm.tsx  (Card overrides removed)
     └─ docs/ui-guidelines/design-system.md             (new anti-patterns)

Dokumentation:
 ├─ CHANGELOG.md             (logge alle 9 ændringer)
 └─ docs/ui-guidelines/design-system.md   (anti-patterns + tokens)
```

### Risiko & test
- **Lav risiko**: Pkt. 1, 2, 5, 6, 8, 9 — kun visuelt.
- **Middel risiko**: Pkt. 3 (logikken testes med både single-day og multi-day sager), pkt. 4 (verificér at mutationer fortsat opdaterer UI lokalt + at banneret ikke længere flasher efter egne handlinger), pkt. 7 (verificér at filter-/sort-funktionalitet i tabeller er uberørt).
- Multi-tenant: ingen ændring i dataforespørgsler.
- Backwards compatibility: legacy `gradient`/`glass` button-varianter slettes — rg-søgning bekræfter ingen brug i dag.

### Scope-reduktion mulig
Hvis det er for stort i én PR, kan vi splitte i to runder:
- **Runde A**: pkt 1, 2, 3, 5 (hurtige UX-fixes — 1 commit).
- **Runde B**: pkt 4, 6, 7, 8, 9 (overhaul + auto-refresh — 1 commit).

Sig til hvis du foretrækker opsplitning, ellers udfører jeg alt i én tur.
