## Audit-resultat

`src/components/Layout/AppSidebar.tsx`:
- **Item-className (linje 80-85):** `transition-colors` (color/bg-transition uden eksplicit varighed → bruger tailwind-default 150ms — acceptabel, men ikke eksplicit).
- **Aktiv state:** `bg-sidebar-primary text-sidebar-primary-foreground` — solid fyldt brand-blå, ikke `bg-primary/10 text-primary`.
- **Hover:** `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground` — ikke `bg-accent/40`.
- **Aktiv-dekoration (linje 88-93):** absolut-positioneret 3px venstre-bar (`bg-primary-foreground/80`). Statisk (ikke animeret) men dekorativ kant — strider mod "active state = bg-primary/10 + text-primary, intet andet".
- **Ingen** `scale`, `translate`, `box-shadow`, glow eller `animate-*` fundet på items.
- **Notifikations-badge (linje 96-109):** ingen animation. OK.

`src/components/ui/sidebar.tsx` (shadcn primitive — uden for scope):
- `sidebarMenuButtonVariants` har `transition-[width,height,padding]` (struktur-transition for icon-rail collapse — ikke item-hover) og default `data-[active=true]:bg-sidebar-accent`. Da `SidebarMenuButton` kalder `cn(variants(), className)`, vinder vores eksplicitte `bg-primary/10`-klasse via `tailwind-merge`. Ingen ændring nødvendig her, og ingen ændring foretages (det ville påvirke alle sidebars globalt og bryde collapse-animationen).

Token-note: i denne app er `--accent` og `--primary` semantiske tokens. `bg-primary/10` og `bg-accent/40` virker direkte. Tekst i sidebar bruger `--sidebar-foreground`-token i ikke-aktiv tilstand — beholdes for kontrast.

## Planlagte ændringer

### `src/components/Layout/AppSidebar.tsx` — `renderItem` (linje 71-114)
- `className` på `SidebarMenuButton`:
  - Erstat `'h-10 relative font-medium transition-colors'` med `'h-10 font-medium cursor-pointer transition-[background-color,color,opacity] duration-150 ease-out'` (fjern `relative` — ikke længere nødvendig uden venstre-bar).
  - Aktiv-gren: `'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary'` (overrider variantens `data-[active=true]:bg-sidebar-accent` via tailwind-merge).
  - Inaktiv-gren: `'text-sidebar-foreground/80 hover:bg-accent/40'` (ingen `hover:text-*` farveskift, ren bg-fade).
- Slet aktiv venstre-bar (linje 88-93) inkl. `aria-hidden`-span.
- Behold ikon, label, notifikations-badge uændret. Notifikations-badge i aktiv tilstand justeres så det matcher den nye, lysere aktive baggrund: `bg-primary/15 text-primary` i stedet for `bg-primary-foreground/20 text-primary-foreground` (sikrer læsbarhed mod `bg-primary/10`).

### Collapsed icon-rail
Ingen separat kodevej — items rendres med samme `renderItem`. Den nye flade regel-set gælder automatisk i icon-mode (variantens `group-data-[collapsible=icon]:!size-8 !p-2` styrer kun størrelse, ikke farver/animationer).

### Out of scope (bevares)
- `src/components/ui/sidebar.tsx`: ingen redigering af shadcn-primitiven. `transition-[width,height,padding]` på selve `Sidebar` er kollaps-strukturanimationen (ikke en hover/active-effekt) og er nødvendig for at icon-rail glider på plads.
- Footer/Header layout, logo, separators.
- `--sidebar-*` token-værdier.

### `CHANGELOG.md`
Tilføj entry "AppSidebar: flade hover/active states uden dekorationer".

## Verifikation

- `grep "scale\\|translate\\|shadow\\|animate-" src/components/Layout/AppSidebar.tsx` → 0 hits.
- Browser-screenshot af `/dashboard` (sidebar åben) og en collapsed-state for at bekræfte:
  - Aktivt item: lys `primary/10` baggrund, primary tekst, ingen venstre-bar, ingen glow.
  - Hover: blød `accent/40` baggrund, ingen scale/skygge.
  - 150ms ease bg-fade.
