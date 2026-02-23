

## Fix: PullToRefresh blokerer scroll i Drawers

### Problem

`PullToRefresh`-komponenten lytter paa `touchStart`/`touchMove` paa hele `<main>` og tjekker kun `window.scrollY === 0`. Naar en Drawer er aaben, er siden stadig scrollet til toppen, saa PullToRefresh aktiveres og "stjeler" swipe-ned-bevaegelsen fra Draweren.

### Loesning

Ret `PullToRefresh.tsx` saa den ignorerer touch-events der starter inde i en Drawer eller et overlay:

**I `handleTouchStart`** (linje 29-34): Tilfoej et tjek paa touch-target:

```typescript
const handleTouchStart = (e: React.TouchEvent) => {
  // Skip if touch originates inside a Drawer or overlay
  const target = e.target as HTMLElement;
  if (target.closest('[data-vaul-drawer]') || target.closest('[data-vaul-overlay]') || target.closest('[role="dialog"]')) {
    return;
  }
  if (window.scrollY === 0) {
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }
};
```

Dette bruger vaul's egne `data-vaul-drawer` og `data-vaul-overlay` attributter samt den generelle `[role="dialog"]` selector til at detektere om brugeren interagerer med en overlay-komponent.

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/components/shared/PullToRefresh.tsx` | Tilfoej `closest()` check i `handleTouchStart` |
| `CHANGELOG.md` | Dokumenter fix |

### Hvorfor dette virker

- `data-vaul-drawer` saettes automatisk af vaul-biblioteket paa alle Drawer-elementer
- `data-vaul-overlay` saettes paa overlay-baggrunden
- `role="dialog"` dækker ogsaa Radix Dialog og andre modale komponenter
- Naar brugeren swiper inde i en Drawer, returnerer `handleTouchStart` tidligt og PullToRefresh aktiveres aldrig
- Desktop og normal mobil-scroll er upaavirkede

### Kvalitetstjek
- Swipe ned i en Drawer scroller listen -- IKKE pull-to-refresh
- Swipe ned paa selve ugeplanen (uden Drawer) aktiverer stadig pull-to-refresh som forventet
- Alle tre selectors (Employee, Car, Responsible) virker korrekt paa mobil

