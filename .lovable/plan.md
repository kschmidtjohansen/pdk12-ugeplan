
Brugeren vil forbedre `SeriesActionDialog` (vist i screenshot) — i stedet for tre knapper i bunden ønskes en pænere løsning med en select box.

Lad mig læse den nuværende komponent og vurdere design.

Nuværende design: AlertDialog med titel, beskrivelse og 3 knapper (Annuller, Kun denne dag, Denne og fremadrettede dage). Knapperne wrapper grimt på smalle skærme.

Forslag til nyt design:
- Behold AlertDialog struktur
- Erstat de to valg-knapper med en **RadioGroup** (visuelt pænere end select box til binære valg, og mere tilgængelig)
- Hver radio-option vises som et klikbart kort med titel + kort beskrivelse
- Bunden har kun: Annuller (secondary) + Bekræft (primary, destructive ved delete)
- Defaultvalg: "Kun denne dag" (sikkerheds-default)

Hvorfor RadioGroup frem for Select:
- Begge valg synlige uden ekstra klik (bedre UX for kun 2 valg)
- Mere "premium" SaaS-look (Linear/Notion stil) som matcher app-design
- Valg-konteksten (beskrivelse under hver) er straks synlig

Hvis brugeren strikt vil have en `<Select>` dropdown, kan vi gøre det i stedet — men jeg foreslår RadioGroup som default fordi det passer bedre til kompakt SaaS-design og 2 valg.

## Plan: Pænere SeriesActionDialog med radio-valg

### Design
```
┌─────────────────────────────────────────┐
│ Rediger serieopgave                     │
│ Denne opgave er del af en serie...      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ◉ Kun denne dag                     │ │
│ │   Ændringer påvirker kun valgte dag │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ○ Denne og fremadrettede dage       │ │
│ │   Opdaterer alle dage i serien      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│              [Annuller]   [Bekræft]    │
└─────────────────────────────────────────┘
```

### Ændringer
**Fil**: `src/components/Planner/SeriesActionDialog.tsx`
- Importér `RadioGroup`, `RadioGroupItem` fra `@/components/ui/radio-group`
- Tilføj lokal `useState` for valgt option (`'single' | 'series'`, default `'single'`)
- Render to klikbare kort-style radio-options med label + beskrivelse
- Footer: kun Annuller + Bekræft-knap (Bekræft kalder `onSingleDay` eller `onEntireSeries` baseret på valg)
- Reset valg til `'single'` når dialog lukkes
- Bekræft-knap er `destructive` variant ved `mode='delete'`, ellers `default`

**Fil**: `src/translations/da/planner.ts` + `src/translations/en/planner.ts`
- Tilføj korte beskrivelser til hver option:
  - `series.onlyThisDayDescription`: "Ændringer påvirker kun den valgte dag"
  - `series.entireSeriesDescription`: "Opdaterer alle dage i serien"
  - `series.confirm`: "Bekræft"

**Fil**: `CHANGELOG.md` — log UI-forbedring

### Scope
- 4 filer
- Ingen logik-ændring i kald-stederne (`AssignmentDialogManager`, `PlannerPage`) — props er uændrede
- Ingen DB-ændringer
