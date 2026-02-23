

## Fix: Mobil-scroll i Selectors -- Drawer-baseret loesning

### Problemanalyse

Den forrige loesning med `modal={false}` + `onTouchMove stopPropagation` virker ikke paa mobil fordi:

1. **`modal={false}`** opretter ingen overlay -- touch-events lækker direkte til PullToRefresh og browser pull-to-refresh
2. **`e.stopPropagation()`** stopper kun React synthetic events, ikke native browser touch-handling
3. **CSS `overscroll-behavior: contain`** virker kun naar elementet allerede har scroll-focus, men paa mobil faar browseren touch-eventet foerst

### Loesning: Drawer paa mobil, Popover paa desktop

Den mest stabile loesning er at bruge `Drawer` (vaul) paa mobil og beholde `Popover` paa desktop. Drawers haandterer mobil-scroll korrekt "out of the box" fordi de bruger en fuld overlay og native scroll-container.

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/components/Planner/EmployeeSelector.tsx` | Drawer paa mobil, Popover paa desktop |
| `src/components/Planner/MultipleCarSelector.tsx` | Drawer paa mobil, Popover paa desktop |
| `src/components/Planner/CarSelector.tsx` | Drawer paa mobil, Popover paa desktop |
| `src/components/Planner/ResponsibleUserSelector.tsx` | Drawer paa mobil, Popover paa desktop |
| `CHANGELOG.md` | Dokumenter Drawer-fix |

### Teknisk implementering

For hver selector:

1. Import `useIsMobile` fra `@/hooks/use-mobile`
2. Import `Drawer`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerTrigger` fra `@/components/ui/drawer`
3. Tilfoej `const isMobile = useIsMobile()` og en `open`/`setOpen` state
4. Render betinget:
   - **Mobil**: `Drawer` med `DrawerContent` der indeholder listen med `overflow-y-auto` og forced inline styles (`touchAction: 'pan-y'`, `overscrollBehavior: 'contain'`, `WebkitOverflowScrolling: 'touch'`)
   - **Desktop**: Eksisterende `Popover` med `modal={false}` (uaendret)
5. Listen-indholdet (items) deles i en faelles variabel/funktion saa det ikke duplikeres

### Eksempel-struktur (EmployeeSelector)

```text
if (isMobile) {
  <Drawer open={open} onOpenChange={setOpen}>
    <DrawerTrigger asChild>
      <Button>...</Button>
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Vaelg medarbejdere</DrawerTitle>
      </DrawerHeader>
      <div 
        className="max-h-[60dvh] overflow-y-auto px-4 pb-4"
        style={{ touchAction: 'pan-y', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        {renderEmployeeList()}
      </div>
    </DrawerContent>
  </Drawer>
} else {
  <Popover modal={false}>
    ... (eksisterende desktop-kode)
  </Popover>
}
```

### Fordele

- Drawer bruger fuld-skaerms overlay -- ingen touch-leak til baggrunden
- Native scroll inde i DrawerContent virker perfekt paa iOS og Android
- PullToRefresh kan aldrig trigges fordi Drawer har sin egen overlay
- Desktop-oplevelsen er uaendret (Popover)
- Ingen hacky CSS overrides noedvendige

### Kvalitetstjek
- Swipe op/ned i bil-listen scroller listen flydende paa mobil
- PullToRefresh aktiveres IKKE naar Drawer er aaben
- Desktop-scroll (mousewheel) virker stadig korrekt via Popover
- Ingen `pointer-events: none` eller `user-select: none` paa scrollbare elementer
- Overholder UI-guidelines (responsive design, semantic farver)

