# EmployeeSelector: stabil positionering + tastaturnavigation

## Mål
Dropdown i medarbejdervælgeren skal altid blive inde i viewport, rulle korrekt med mange medarbejdere og kunne betjenes med tastatur (piletaster + Enter) uden at miste scroll-synkronisering med den virtualiserede liste.

## Nuværende tilstand (verificeret)
- Desktop bruger `Popover modal={true}` med `side="bottom"`, `align="start"`, `sideOffset={4}`, `collisionPadding={16}` og max-højde `min(50vh, 420px)`.
- Mobil bruger `Drawer`.
- Listen er virtualiseret med `@tanstack/react-virtual` (2 kolonner desktop, 1 mobil).
- Søgefeltet stopper al tastaturpropagation (`onKeyDown` → `stopPropagation`), så der er ingen pil-/Enter-navigation. `stopPropagation` betyder også, at Popoverens egen tastaturhåndtering aldrig når feltet.
- Efter søgning nulstilles scroll, men der er ingen aktiv/highlightet række at navigere med.

## Ændringer

### 1. Tastaturnavigation
- Ny state `activeIndex` (index i den flade `visibleEmployees`-liste), sat til første medarbejder når listen åbnes eller søgning ændres.
- `onKeyDown` på søgefeltet (beholder `stopPropagation` for andre taster):
  - `ArrowDown` / `ArrowUp`: flyt `activeIndex` (cyklisk), kald `rowVirtualizer.scrollToIndex(Math.floor(index / columns))` så den aktive række altid er synlig i den virtualiserede scroll.
  - `Enter` / `Space`: toggle den aktive medarbejder (samme logik som klik, inkl. låste medarbejdere blokeres).
  - `Escape`: standard Popover/Drawer-lukning (fjerne ikke stopPropagation for Escape).
  - `Tab`: spring til næste element (default adfærd, ingen fangst).
- Visuelt: aktiv medarbejder får `ring-2 ring-primary` / accent-baggrund så man kan se hvor man er.
- Mus hover opdaterer `activeIndex`, så tastatur og mus ikke kommer ud af sync.

### 2. Positionering (desktop Popover)
- Behold `side="bottom" align="start"`, men sæt `avoidCollisions` eksplicit, `sideOffset={6}` og `collisionPadding={12}`.
- `PopoverContent` får `onOpenAutoFocus` der fokuserer søgefeltet (så man kan taste med det samme), og container-højden begrænses med `max-h-[min(50vh,420px)]` + `min-w` svarende til triggeren, så menuen aldrig skubbes under menulinjen/viewport-kanten på Windows.
- Verificer at `modal={true}` ikke blokerer page-scroll unødigt; behold modal for konsistent fokusfælde.

### 3. Scrolling (mobil Drawer)
- `DrawerContent` får `max-h-[85vh]` og internt `overflow-y-auto` på selve listen, så virtualizerens scroll-element altid er defineret og menuen ikke løber ud af skærmen.
- Søgefeltet forbliver sticky øverst i begge varianter.

### 4. Verifikation
- Typecheck (`tsgo`), lokal HTTP 200.
- Opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.

## Tekniske detaljer
- Fil: `src/components/Planner/EmployeeSelector.tsx` (alle ændringer samlet her; ingen API- eller dataændringer).
- `scrollToIndex` fra `rowVirtualizer` bruges i stedet for DOM `scrollIntoView`, fordi virtualiseringen ellers ikke har renderet rækken.
- Ingen ændring af sortering, låseregler eller oversættelser udover evt. ingen nye keys (genbruger eksisterende).
