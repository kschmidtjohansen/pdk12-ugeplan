## Gør visningsknapperne i Ugeplan mindre

De fire knapper til valg af visning (liste, gitter, kompakt, kalender) øverst i Ugeplan gøres mindre: ca. 32 px i stedet for 44 px, med mindre ramme og luft. Ikonerne og deres funktion er uændrede.

### Teknisk
- `src/components/Planner/page/PlannerHeader.tsx`: ToggleGroupItem `h-11 w-11` -> `h-8 w-8`, ikoner bliver `h-3.5 w-3.5`; gruppens `p-0.5` beholdes. Den delte toggle-group-komponent ændres ikke.
- CHANGELOG opdateres. Ingen publicering.
