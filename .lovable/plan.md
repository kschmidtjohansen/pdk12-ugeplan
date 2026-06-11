## Mål
Tilføj lidt mere luft (padding) mellem den øverste header (AppTopBar) og sideindholdet — globalt, så det gælder alle sider (Dashboard, Ugeplan, Medarbejdere, osv.).

## Ændring
- **`src/components/Layout/AppShell.tsx`**: Tilføj `pt-2 md:pt-4` til `<main>`-elementet, så alt sideindhold får ekstra topafstand under header.

```tsx
className="flex-1 w-full pt-2 md:pt-4 pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0"
```

Dette giver ~8px ekstra luft på mobil og ~16px på desktop mellem header og første element på siden, uden at ændre individuelle sider.

## Verifikation
Tjek Dashboard, Planner og Admin-sider visuelt for at sikre at afstanden ser ensartet og bedre ud, og at intet bryder layoutet.

## Changelog
Tilføj: `2026-06-11 — Global ekstra top-padding mellem header og sideindhold`
