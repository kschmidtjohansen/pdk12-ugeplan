## Mål
Medarbejder-labels på opgavekort (Ugeplan grid + andre steder) skal vise rolle-farverne fra `getRoleBadgeClass`:
- Skadeleder → lilla
- Fugttekniker → blå
- Servicemedarbejder/Vikar → grøn
- Admin/Super Admin → lilla / amber

I dag overskygges rolle-farven af klassen `chip-person` (teal) i `src/index.css`, så alle medarbejder-chips ender med samme tealgrønne look uanset rolle.

## Ændringer

### 1) `src/components/Planner/AssignmentDetails.tsx`
- Fjern `chip-person` fra de inline medarbejder-chips, så `getRoleBadgeClass(item.role)` alene styrer baggrund/border/tekstfarve. Behold `chip` og `border` for form og padding.
  - Linje 154: `className={cn('chip border', getRoleBadgeClass(item.role))}`
- I tooltippet (når der er >2 medarbejdere) skal prikken bruge `getRoleDotClass(item.role)` i stedet for `getRoleBadgeClass` (som indeholder bg+border+text — prikken skal kun have bg).
  - Importer `getRoleDotClass` fra `@/utils/roleColors`.
  - Linje 179: `<span className={cn('h-1.5 w-1.5 rounded-full shrink-0', getRoleDotClass(item.role))} />`
- "X medarbejdere"-knappen (collapsed state) får en neutral chip-stil, fx `chip border bg-muted text-foreground`, så den ikke fejlagtigt signalerer én bestemt rolle.

### 2) `src/components/Planner/CompactAssignmentRow.tsx`
- Brug også rolle-farve på medarbejder-chippen i listevisningen, baseret på den højest rangerede rolle blandt de tilknyttede medarbejdere (genbrug `getEffectiveRole` fra `roleHierarchy` til at vælge tone, da chippen viser ét samlet label).
- Erstat `chip chip-person` med `chip border ${getRoleBadgeClass(effectiveRole)}`.

### 3) Verifikation
- Tjek Ugeplan grid-visning: Mark/Ronnie (servicemedarbejder) bliver grønne, en skadeleder bliver lilla, en fugttekniker bliver blå.
- Tjek compact/list-visning samme sted.
- Tjek dark mode (badge-klasserne har lyse baggrunde — acceptabelt, samme stil bruges allerede i `EmployeeSelector` og `AssignmentDetails` dialogen).

## Changelog
`2026-06-11 — Medarbejder-labels på opgavekort viser nu rolle-farve (lilla/blå/grøn) i både grid- og listevisning`

## Tekniske noter
- Ingen ændringer i `roleColors.ts` eller `roleHierarchy.ts` — kun forbrug.
- `chip-person`-klassen bevares i CSS, men bruges ikke længere på medarbejder-chips. Den kan stå som fallback/forventet brug andre steder uden påvirkning.
