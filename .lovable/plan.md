
## Fix: Desktop scroll i selectors + mobil beskrivelse tjek

### Problem 1: Desktop scroll virker ikke i selectors

**Rodaarsag fundet**: Radix Dialog bruger `react-remove-scroll` (via `RemoveScroll`) til at laase scroll paa alt udenfor dialogen. Selectorernes Popover renderer via en portal til `document.body`, som er UDENFOR dialogens tilladte scroll-omraade. Resultatet er at `react-remove-scroll` blokerer al scroll i popover-listen.

Nuvaerende kode bruger `modal={false}` paa Popover, som bruger `PopoverContentNonModal` -- denne wrapper IKKE i `RemoveScroll`. Naar `modal={true}` bruges, wrapper Radix popover-indholdet i sin egen `RemoveScroll`, som korrekt "nester" med dialogens `RemoveScroll` og tillader scroll.

### Problem 2: Beskrivelse for Servicemedarbejder/Skadeleder

Efter gennemgang af `AssignmentDetailsDialog.tsx` og `MineOpgaver.tsx`: Der er INGEN rolle-baserede begransninger der skjuler beskrivelsen. `assignment.description` vises altid naar den eksisterer, uanset rolle. `isChatEnabled`/`isFilesEnabled` er afdelingsbaserede, ikke rollebaserede. Der er ingen kodeaendringer noedvendige her -- alle roller kan se beskrivelsen korrekt.

### Loesning

#### Fil 1-3: `EmployeeSelector.tsx`, `MultipleCarSelector.tsx`, `CarSelector.tsx`

AEndr desktop Popover fra `modal={false}` til `modal={true}`:

```tsx
// FoerPopover modal={false}>

// EfterPopover modal={true} open={open} onOpenChange={setOpen}>
```

Fjern `onPointerDownOutside` handler (ikke noedvendig med `modal={true}` da Radix haandterer dette automatisk).

Behold `onWheel stopPropagation` som ekstra sikkerhed.

#### Fil 4: `ResponsibleUserSelector.tsx`

Samme aendring: `modal={false}` til `modal={true}`.

#### Fil 5: `CHANGELOG.md`

Dokumenter fix.

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/components/Planner/EmployeeSelector.tsx` | `modal={true}` + tilfoej `open`/`setOpen` state paa desktop Popover |
| `src/components/Planner/MultipleCarSelector.tsx` | `modal={true}` paa desktop Popover |
| `src/components/Planner/CarSelector.tsx` | `modal={true}` paa desktop Popover |
| `src/components/Planner/ResponsibleUserSelector.tsx` | `modal={true}` paa desktop Popover |
| `CHANGELOG.md` | Dokumenter fix |

### Hvorfor dette virker

- `modal={true}` paa Popover wrapper indholdet i `RemoveScroll` (linje 132 i Radix Popover source)
- `RemoveScroll` fra Popover "nester" korrekt med `RemoveScroll` fra Dialog
- Scroll inde i popover-listen virker fordi det er indenfor den aktive `RemoveScroll`-scope
- Popover lukker ved klik udenfor (standard adfaerd med `modal={true}`)
- Escape lukker popover foerst, derefter dialog (korrekt nesting)

### Problem 2 resultat

Ingen kodeaendringer noedvendige. `AssignmentDetailsDialog` har ingen rolle-tjek paa beskrivelsen. Alle roller (Servicemedarbejder, Skadeleder, Administrator) kan se beskrivelsen fuldt ud. `MineOpgaver` sender `assignment` med alle data til dialogen uden filtrering.

### Kvalitetstjek
- Desktop: Scroll i alle fire selectors virker inde i opgave-dialogen
- Mobil: Drawer fungerer stadig korrekt (upaavirkede af denne aendring)
- Popover lukker korrekt ved klik udenfor
- Escape-tast lukker popover foerst, derefter dialog
- Beskrivelse er synlig for alle roller paa mobil
