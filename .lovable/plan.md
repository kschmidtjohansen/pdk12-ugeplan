## Mål
Bil-selectoren (Popover på desktop) klippes af nederst i dialogboksen, så de sidste biler ikke kan ses eller scrolles til. Den indre scroll bruger `max-h-[70vh]`, men hvis popoveren åbnes tæt på bunden af viewport, ender den alligevel uden for skærmen.

## Ændring
**`src/components/Planner/MultipleCarSelector.tsx`** (linje 323–333):
- Brug Radix Popover's egen tilgængelige højde via CSS-variablen `--radix-popover-content-available-height` på `PopoverContent`, så den altid passer i viewporten.
- Sæt `collisionPadding={8}` og `avoidCollisions` (default true) så den flipper/begrænses korrekt.
- Erstat den indre `max-h-[70vh]` med `max-h-full`, så listen scroller inden for popoverens reelle højde.

Konkret:
```tsx
<PopoverContent
  className="w-96 p-0 z-[60] bg-popover border shadow-lg flex flex-col max-h-[min(70vh,var(--radix-popover-content-available-height))]"
  sideOffset={4}
  collisionPadding={8}
>
  <div
    className="flex-1 overflow-y-auto overscroll-contain"
    onWheel={(e) => e.stopPropagation()}
  >
    {renderCarList()}
  </div>
</PopoverContent>
```

Mobile Drawer-grenen er allerede scrollbar (`max-h-[70dvh] overflow-y-auto`) og rører jeg ikke.

## Verifikation
Åbn "Opret opgave" → Vælg Biler i bunden af viewporten og bekræft at hele listen kan scrolles til (Trailer, Vagt 1, etc. synlige).

## Changelog
`2026-06-11 — MultipleCarSelector popover begrænses nu til tilgængelig viewport-højde og scroller indvendigt`
