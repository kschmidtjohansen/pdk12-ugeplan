# Hurtigere medarbejdervælger med mange medarbejdere

Medarbejdervælgeren tegner i dag alle medarbejdere på én gang. I store afdelinger betyder det mange hundrede rækker ved hver åbning, hvilket giver langsom åbning, hakkende scroll og træg søgning.

## Hvad der ændres

- Kun de rækker, der faktisk er synlige i vinduet (plus en lille buffer), bliver tegnet. Resten oprettes først, når du scroller ned.
- Listen ser og opfører sig præcis som nu: søgefelt øverst, valgte medarbejdere først, to kolonner på store skærme, én kolonne på mobil, samme statusprikker, låseårsager og tooltips.
- Låselogikken, ferie-/kursus-/fuldt-booket-reglerne og valg/fravalg ændres ikke.
- Rulleområdet får en fast højde, så listen ikke hopper, når man søger.

## Teknisk

Fil: `src/components/Planner/EmployeeSelector.tsx`

- Brug `@tanstack/react-virtual` (allerede installeret som afhængighed via React Query-økosystemet — tilføjes eksplicit til `package.json` hvis den ikke er en direkte afhængighed).
- Flyt render-logikken for én medarbejder ud i en intern `EmployeeRow`-komponent, så virtualiseringen kan kalde den pr. indeks uden at duplikere kode.
- Virtualisér på rækkeniveau: `visibleEmployees` grupperes i rækker à 1 (mobil) eller 2 (desktop, matcher nuværende `sm:grid-cols-2`). Kolonneantal bestemmes af det eksisterende mobil/desktop-flag, ikke ny media-logik.
- `useVirtualizer` med `getScrollElement` peget på scroll-containeren i både `PopoverContent` og `DrawerContent`, `estimateSize` ≈ 56 px og `measureElement` for dynamisk højde (rækker med låseårsag er højere).
- Scroll-containeren beholder `max-h-[70vh]` (popover) / `max-h-[80dvh]` (drawer), men får også en eksplicit højde, så virtualizeren kan måle.
- Virtualizeren nulstilles (`scrollToIndex(0)`) når søgeteksten ændres.
- Tomtilstanden (`employees.noResults`) og `TooltipProvider` bevares uændret.

## Verifikation

- Typecheck.
- Visuel kontrol i preview på både desktop-popover og mobil-drawer: søgning, valg, fravalg, låste rækker med årsagstekst og scroll.
- `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres efter implementering.
