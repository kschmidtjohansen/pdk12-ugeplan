## Fase 3 — UI/Visual & a11y (statisk)

Fokuseret oprydning af de a11y/UI-problemer som statisk scanning afslørede. Holder mig i frontend-laget. Ingen ændringer af forretningslogik, RLS eller knowledge-rules (180min timeout, multi-tenant isolation, kompakt design, dialog-scrolling, etc. uændret).

### 1. Icon-only buttons mangler `aria-label` (34 fund)

shadcn `Button size="icon"` er kun 36×36 og uden tekst → screen readers læser intet. Tilføjer `aria-label` (dansk, fallback til engelsk via `t()` hvor TranslationContext findes) til alle 34 fund:

```text
Admin/DepartmentManagement.tsx           (4)  — gem/annullér/rediger/slet
Admin/SubDepartmentManagement.tsx        (4)  — samme mønster
Admin/UserManagement.tsx                 (2)  — pagination forrige/næste
Admin/UserTableRow.tsx                   (4)  — handlinger pr. række
Admin/VacationCalendarOverview.tsx       (2)  — forrige/næste måned
Assignment/AssignmentFilesPanel.tsx      (4)  — download/slet/visning
Assignment/AssignmentMessagesPanel.tsx   (2)  — send/slet besked
Cars/FalckSubscriptionButton.tsx         (3)  — gem/annullér/rediger
Duty/DutyList.tsx                        (2)  — handlinger
Duty/DutyMonthCalendar.tsx               (2)  — forrige/næste måned
Layout/NavComponents/NotificationsDropdown.tsx (1) — notifikationer
Layout/NavComponents/NotificationsList.tsx     (1) — afvis
Notifications/NotificationsDropdown.tsx        (1) — notifikationer
ui/sidebar.tsx                                  (1) — toggle sidebar
```

### 2. Dobbelt `<main>`-element

`src/pages/LoginPage.tsx:181` har `<main>` direkte i route-komponenten OG `src/components/Layout/AppShell.tsx:17` har `<main>` i layoutet. shadcn `ui/sidebar.tsx` har også et `<main>` der kun renders i sidebar-context. WCAG kræver præcis ét `<main>` pr. side.

- Skifter LoginPage’s `<main>` til `<section>` (LoginPage bypasser MainLayout via path-check, så AppShell’s `<main>` rendres ikke her — men der må stadig kun være ét på siden, og semantisk er højre kolonne en `section` af page-roden).
- Lader AppShell’s `<main>` være rod-elementet for alle authenticated routes.
- `ui/sidebar.tsx`’s indre `<main>` ændres til `<div role="main">`-wrapper alternativt fjernes, da AppShell allerede leverer `<main>`. Konkret: ændrer linje 320 til `<div>` og bevarer styling — det indre var en wrapper, ikke siderod.

### 3. Lav-kontrast tokens

To fund: `text-muted-foreground/40` på empty-state ikoner i `EmployeesTable.tsx:94` og `CarsList.tsx:36`. Hæver til `text-muted-foreground/60` for at ramme WCAG AA på dekorative ikoner uden at gøre dem aggressive.

### 4. Hardcoded farver — bevidst skip

219 hits er overvejende intentionelle status-farver (røde fejl-states, grønne success-badges, gule advarsler) der er semantisk meningsfulde og knowledge-godkendte (Realtime status, traffic-light indicators, availability dots). Refaktorering til design-tokens for disse ville skabe mere risiko end gevinst og ligger uden for scope. Lader dem stå.

### Ud af scope (gemmes til senere fase eller skal aftales separat)

- Tap-target audit på mobil (kræver browser/runtime).
- Focus-visible review på custom widgets (skal verificeres i browser).
- Heading-hierarki audit pr. side (>10 sider, kræver dyb gennemgang).
- Image alt-tekst audit (få brugerbilleder; logoer har allerede `alt`).

### Verificering

- TypeScript build (auto via harness).
- Genscanner med samme regex efter ændringer for at bekræfte 0 icon-buttons mangler aria-label.
- Verificerer at LoginPage/AppShell hver kun rendrer ét `<main>` pr. route.

### Changelog

Tilføjer "Fase 3: UI/a11y" sektion til `CHANGELOG.md` med liste over ændrede filer og fund.
