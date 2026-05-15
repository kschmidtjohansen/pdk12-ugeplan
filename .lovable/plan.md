## Audit-resultat

`rg "chip-glass" src/` viser **kun ét aktivt forbrugssted**: `src/components/Planner/ConflictBadge.tsx` (linje 33) bruger `chip-glass-destructive`. De Planner-komponenter du nævner (`AssignmentCard`, `AssignmentDetails`, `CompactAssignmentRow`) refererer **ikke** til nogen `chip-glass*`-klasse — hverken nu eller via wrapper-helpers. Selve klasse-definitionerne (linje 392–465 i `src/index.css`) er derimod stadig udsendt i bundlen.

CSS-tokens: projektet eksponerer ikke `--color-background-secondary`. De tilgængelige semantiske tokens er `--background`, `--card`, `--secondary`, `--muted`, `--border`, `--primary`, `--destructive` (alle som `H S L`). Jeg bruger `--muted` som den "muted background"-token planen omtaler — det matcher det høj-densitets, rolige UI-sprog (bg `#f8fafc`-lignende).

## Planlagte ændringer

### `src/index.css` (linje 392–465)
Erstat `.chip-glass`, `.chip-glass-primary`, `.chip-glass-amber`, `.chip-glass-emerald`, `.chip-glass-indigo`, `.chip-glass-destructive` (+ deres `.dark`-overrides) med flade pille-utilities:

- Fælles base (extracted i kommentar): `background: hsl(var(--muted))`, `border: 0.5px solid hsl(var(--border))`, `color: hsl(var(--foreground))`, **ingen** `backdrop-filter`, **ingen** `box-shadow`, **ingen** translucens.
- Farvevarianter beholder den eksisterende ramp men som flade tokens:
  - `chip-glass-primary` → `color: hsl(var(--primary))`, border `hsl(var(--primary) / 1)` ved 0.5px (solid token, ingen alpha-fyld). Background forbliver `hsl(var(--muted))` så pillerne læses ensartet.
  - `chip-glass-amber` → `color: hsl(35 92% 35%)` (light) / `hsl(35 92% 75%)` (dark), border `hsl(35 92% 50%)`.
  - `chip-glass-emerald` → `color: hsl(152 60% 28%)` / `hsl(152 60% 70%)`, border `hsl(152 60% 40%)`.
  - `chip-glass-indigo` → `color: hsl(231 60% 40%)` / `hsl(231 70% 78%)`, border `hsl(231 70% 55%)`.
  - `chip-glass-destructive` → `color: hsl(var(--destructive))`, border `hsl(var(--destructive))`.
- Klassenavnene bevares (så `ConflictBadge.tsx` ikke skal ændres), men kommentaren opdateres fra "Frosted-glass chips" til "Flat pill chips".

### Planner-komponenter
Ingen ændringer — de bruger ikke `chip-glass*` i dag. Hvis du forventede status-/tag-pills i `AssignmentCard`/`AssignmentDetails`/`CompactAssignmentRow`, ligger de under andre klasser (fx shadcn `Badge`) og er uden for denne opgave. Sig til hvis jeg skal udvide scope.

### `CHANGELOG.md`
Tilføj entry "Flat pill-chips erstatter frosted-glass" øverst med kort opsummering af tokens og at kun `ConflictBadge` påvirkes visuelt.

## Verifikation

- `rg "chip-glass" src/` → samme ene træf i `ConflictBadge.tsx` (intet er fjernet utilsigtet).
- Browser-screenshot af Planner med en konflikt-badge for at bekræfte den nye flade pille (light + dark mode).

## Out of scope

- Ingen logik-ændringer.
- Ingen omdøbning af klasserne (kræver bredere refactor og berører ConflictBadge-API).
- Ingen ændring af shadcn `Badge` eller andre tag-/status-komponenter.
