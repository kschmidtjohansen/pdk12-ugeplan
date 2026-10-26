## Fjern det lille Polygon-billede under "PolyPlan" i sidemenuen

Det lille Polygon-tekstlogo (vist som "img") under navnet "PolyPlan" øverst i sidemenuen fjernes. Det runde ikon og navnet "PolyPlan" bliver stående.

### Teknisk
- `src/components/Layout/AppSidebar.tsx`: slet `<img>` (polygon-logo.svg, ca. linje 150–159) i den udvidede sidebar-header.
- CHANGELOG opdateres. Ingen andre ændringer, ingen publicering.
