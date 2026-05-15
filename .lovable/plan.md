# Virtualisering af Weekly Planner

## Mål
Reducere DOM-noder og render-tid i Planneren når der er mange dage / mange opgaver pr. dag, ved at indføre scroll-vinduet rendering (kun synlige rækker mountes).

## Bibliotek
Tilføj `@tanstack/react-virtual` (lille, headless, understøtter dynamiske rækkehøjder via `measureElement`). Ingen anden runtime-ændring.

## Hvor virtualiserer vi

1. **Day-lister** (én række = én `DaySection` / `CompactDaySection`):
   - `src/components/Planner/CurrentAndFutureDays.tsx`
   - `src/components/Planner/CompactCurrentAndFutureDays.tsx`
   - `src/components/Planner/PastAssignments.tsx`
   - `src/components/Planner/CompactPastAssignments.tsx`

2. **Opgaver inde i en udvidet dag** (én række = én `AssignmentCard` / `CompactAssignmentRow`):
   - `src/components/Planner/DaySection.tsx` (kun listen i `isExpanded` blokken, kun når `gridLayout=false` — grid-layout beholder CSS-grid)
   - `src/components/Planner/CompactDaySection.tsx` (kun den indre liste når `isExpanded`)

## Tilgang

- Tærskel: virtualisering aktiveres først når listen overstiger et bundet (f.eks. dages liste > 10, eller opgaver > 25). Under tærsklen renderes som i dag — undgår overhead og bevarer CLS for små lister.
- Brug `useVirtualizer` med `getScrollElement` koblet til vinduet via en `windowVirtualizer` (`useWindowVirtualizer`), så vi ikke introducerer en indre scroll-container (Planneren scroller på siden i dag).
- Dynamisk rækkehøjde via `measureElement` (DaySection er kollapsbar, så højden ændres ved expand/collapse — virtualizer re-måler).
- `overscan: 4` for at holde scroll glat.
- Stabil `key` = `dateKey` / `assignment.id` (uændret).
- Bevar eksisterende props og kontrakter — kun rendering ændres.

## Filer der oprettes/redigeres

- Edit: `src/components/Planner/CurrentAndFutureDays.tsx`
- Edit: `src/components/Planner/CompactCurrentAndFutureDays.tsx`
- Edit: `src/components/Planner/PastAssignments.tsx`
- Edit: `src/components/Planner/CompactPastAssignments.tsx`
- Edit: `src/components/Planner/DaySection.tsx` (kun expanded liste, ikke-grid)
- Edit: `src/components/Planner/CompactDaySection.tsx` (kun expanded liste)
- Ny lille hjælpekomponent: `src/components/Planner/VirtualList.tsx` — indkapsler `useWindowVirtualizer` med tærskel-fallback, så de fire fil-edits forbliver små og konsistente.
- Edit: `package.json` (via `bun add @tanstack/react-virtual`)
- Edit: `CHANGELOG.md`
- Edit: `docs/implementation-plan/tasks.md` (marker opgaven `[x]`)

## Uden for scope
- Ingen ændring af data-fetching, sortering, filtrering, expand/collapse-logik eller realtime.
- Ingen ændring af `AssignmentCard` / `CompactAssignmentRow` selv.
- Ingen indre scroll-container i Planner (vi bruger window-virtualisering).
- Past-assignments "Vis flere"-knap fjernes ikke i denne omgang (kan evt. fjernes senere når virtualisering kan bære fuld liste — men det rører UX og holdes uden for scope).

## Risici & mitigering
- Måling af variable højder kan give et lille jitter ved expand/collapse. Mitigering: `measureElement` + `estimateSize` baseret på kollapset/udvidet tilstand.
- Ankre/`scrollIntoView` (fx hop til dagens dato) skal stadig virke — vi eksponerer `virtualizer.scrollToIndex(...)` hvis nødvendigt; ellers bevares den nuværende native scroll (window scrollTo) som allerede bruges.
- Keyboard/a11y bevares (knapper og roller uændrede).
