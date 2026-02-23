

## Fix: Kritisk scroll-fejl paa mobil i EmployeeSelector, CarSelector og ResponsibleSelector

### Problemanalyse

Alle tre selectors har scroll-problemer paa mobil af forskellige aarsager:

**EmployeeSelector & MultipleCarSelector**: Bruger `Popover` med `onWheel={e.stopPropagation()}`, men `onWheel` virker kun med mus/trackpad. Paa mobil bruger browseren touch-events, som ikke fanges af `onWheel`. Mangler:
- `touch-action: pan-y` (fortaeller browseren: "kun vertikal scroll her")
- `overscroll-behavior: contain` (forhindrer scroll fra at laekke ud til parent/browser)
- `-webkit-overflow-scrolling: touch` (smooth scroll paa iOS)

**CarSelector**: Samme problem som ovenfor.

**ResponsibleUserSelector**: Bruger stadig `DropdownMenu` (ikke Popover), som har aggressiv focus-trapping der blokerer native scroll paa mobil. Skal konverteres til Popover ligesom EmployeeSelector.

**PullToRefresh interference**: `PullToRefresh` lytter paa `window.scrollY === 0` og kan intercepte touch-events fra popover-lister naar siden er scrollet til toppen.

### Loesning

#### Fil 1: `src/components/Planner/EmployeeSelector.tsx`

Tilfoej touch-venlige CSS-klasser paa scroll-containeren (linje 180):

```
className="max-h-64 overflow-y-auto overscroll-contain touch-pan-y"
```

Tilfoej `onTouchMove` handler for at stoppe propagation til PullToRefresh:

```
onTouchMove={(e) => e.stopPropagation()}
```

#### Fil 2: `src/components/Planner/MultipleCarSelector.tsx`

Samme rettelse paa scroll-containeren (linje 198):

```
className="max-h-64 overflow-y-auto overscroll-contain touch-pan-y"
```

Tilfoej `onTouchMove` handler.

#### Fil 3: `src/components/Planner/CarSelector.tsx`

Samme rettelse paa scroll-containeren (linje 150):

```
className="max-h-60 overflow-y-auto overscroll-contain touch-pan-y"
```

Tilfoej `onTouchMove` handler.

#### Fil 4: `src/components/Planner/ResponsibleUserSelector.tsx`

Konverter fra `DropdownMenu` til `Popover` med `modal={false}`:
- Erstat imports: `DropdownMenu` -> `Popover`, `DropdownMenuContent` -> `PopoverContent`, `DropdownMenuTrigger` -> `PopoverTrigger`, fjern `DropdownMenuItem`
- Tilfoej `modal={false}` paa Popover
- Brug native div-elementer med onClick i stedet for DropdownMenuItem
- Tilfoej scroll-container med `max-h-60 overflow-y-auto overscroll-contain touch-pan-y`
- Tilfoej `onWheel` og `onTouchMove` stopPropagation
- Ret hardcoded farver (`border-indigo-200`, `hover:bg-indigo-50`) til semantic tokens (`border-border`, `hover:bg-accent/50`)

#### Fil 5: `src/index.css`

Tilfoej utility-klasse for `overscroll-behavior: contain` og `-webkit-overflow-scrolling: touch` hvis ikke allerede tilgaengelig via Tailwind:

```css
.overscroll-contain {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
```

(Tailwind v3 har `overscroll-contain` built-in, men `-webkit-overflow-scrolling` kraever custom CSS)

#### Fil 6: `CHANGELOG.md`

Dokumenter mobil-scroll-fix for alle tre selectors.

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/components/Planner/EmployeeSelector.tsx` | Tilfoej `overscroll-contain touch-pan-y` + `onTouchMove` |
| `src/components/Planner/MultipleCarSelector.tsx` | Tilfoej `overscroll-contain touch-pan-y` + `onTouchMove` |
| `src/components/Planner/CarSelector.tsx` | Tilfoej `overscroll-contain touch-pan-y` + `onTouchMove` |
| `src/components/Planner/ResponsibleUserSelector.tsx` | Konverter DropdownMenu til Popover + scroll-fix |
| `src/index.css` | Tilfoej `-webkit-overflow-scrolling: touch` utility |
| `CHANGELOG.md` | Dokumenter mobil-scroll-fix |

### Kvalitetstjek
- Swipe op/ned i bil-listen scroller listen flydende paa mobil
- Swipe op/ned i medarbejder-listen scroller listen flydende paa mobil
- Swipe op/ned i ansvarlig-listen scroller listen flydende paa mobil
- PullToRefresh aktiveres IKKE naar man scroller inde i en selector
- Popover lukker ikke ved scroll
- Desktop-scroll (mousewheel) virker stadig korrekt
- Overholder UI-guidelines (semantic farver)
- Ingen console.log i produktion

