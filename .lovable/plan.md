

## Fix: Kritiske fejl i Afd. 14 -- Selektion, Scroll og Mobil-overlap

### Problemanalyse

**Problem 1: MultipleCarSelector double-toggle (bil-valg virker ikke)**
I `MultipleCarSelector.tsx` har `<label htmlFor="car-{id}">` (linje 230-231) en native kobling til checkbox-inputtet. Naar brugeren klikker paa bil-raekken:
1. `div onClick` (linje 220) kalder `handleCarClick()` -- toggler bilen
2. `<label htmlFor>` sender automatisk et klik til checkbox
3. Checkbox `onChange` (linje 226) kalder `handleCarClick()` igen -- toggler bilen TILBAGE

Resultatet: bilen toggles to gange og ender i samme tilstand. Kun direkte klik paa checkbox virker.

**Problem 2: EmployeeSelector scroll-blokering**
`EmployeeSelector` bruger Radix `DropdownMenu` inde i en `Dialog`. DropdownMenu har aggressiv focus-trapping der blokerer native scroll.

**Problem 3: CarSelector (single) mangler `modal={false}`**
`CarSelector.tsx` bruger `<Popover>` uden `modal={false}`, hvilket foraarsager at Dialog intercepter klik.

**Problem 4: Tekst-overlap paa mobil**
`AssignmentDetailsDialog.tsx` linje 325 har `h-[350px]` paa besked-panelet. Naar beskrivelsen er lang, overlapper den besked-sektionen.

**Problem 5: Console.log i produktion**
`AssignmentForm.tsx` har `console.log` paa linje 225, 233, 244, 253, 261 uden `import.meta.env.DEV`-guard.

### Loesning

#### Fil 1: `src/components/Planner/MultipleCarSelector.tsx`

**Fjern `htmlFor`** fra `<label>` (linje 230-231) og **fjern `onChange`** fra checkbox (linje 226). Goer checkbox til `readOnly` saa kun div's `onClick` haandterer valg. Dette sikrer at et klik paa hele raekken (inkl. label-tekst, badge, bilnavn) toggler bilen praecis en gang.

- Linje 226: `onChange={(e) => { e.stopPropagation(); handleCarClick(car); }}` erstattes med ingenting (fjern onChange, tilfoej `readOnly`)
- Linje 230-231: `<label htmlFor={...}>` erstattes med `<div>` (fjern htmlFor-kobling)

#### Fil 2: `src/components/Planner/EmployeeSelector.tsx`

Erstat `DropdownMenu`/`DropdownMenuContent`/`DropdownMenuItem` med `Popover`/`PopoverContent`/`PopoverTrigger` (samme moenster som MultipleCarSelector). Tilfoej `modal={false}` og native scroll med `onWheel={e.stopPropagation()}`. Tilfoej `e.stopPropagation()` paa klik-handlers. Al eksisterende funktionalitet bevares (afstandsberegning, vacation-check, auto-remove, badges).

#### Fil 3: `src/components/Planner/CarSelector.tsx`

Tilfoej `modal={false}` paa `<Popover>` (linje 130 i original).

#### Fil 4: `src/components/Dashboard/AssignmentDetailsDialog.tsx`

Aendr linje 325 fra `h-[350px]` til `min-h-[300px] max-h-[50dvh]` for fleksibel hoejde paa mobil. Tilfoej `flex-shrink-0` paa description-sektionen.

#### Fil 5: `src/components/Planner/AssignmentForm.tsx`

Omslut `console.log` paa linje 225, 233, 244, 253, 261 med `if (import.meta.env.DEV)` guard.

#### Fil 6: `CHANGELOG.md`

Dokumenter alle fixes.

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/components/Planner/MultipleCarSelector.tsx` | Fjern `htmlFor` fra label, goer checkbox `readOnly`, fjern `onChange` |
| `src/components/Planner/EmployeeSelector.tsx` | Erstat DropdownMenu med Popover + scroll-fix + stopPropagation |
| `src/components/Planner/CarSelector.tsx` | Tilfoej `modal={false}` paa Popover |
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Fix mobil tekst-overlap med fleksibel hoejde |
| `src/components/Planner/AssignmentForm.tsx` | DEV-guard paa console.log |
| `CHANGELOG.md` | Dokumenter fixes |

### RLS-vurdering

RLS-politikkerne for `assignments`, `cars` og `profiles` er korrekte for administratorer. `is_admin_or_skadeleder()` giver fuld adgang til CRUD-operationer. Problemet er udelukkende frontend-komponenternes interaktions-haandtering (double-toggle, scroll-blokering, Popover/Dialog-konflikt). Ingen database-aendringer er noedvendige.

### Kvalitetstjek
- Klik paa bil-raekken (udenfor checkbox) vaelger/fravaelger bilen korrekt (en enkelt toggle)
- Klik direkte paa checkbox virker ogsaa korrekt
- Scroll virker i bil- og medarbejder-lister paa baade desktop og mobil
- Popover lukker ikke ved valg
- Beskrivelse og Beskeder overlapper ikke paa mobil
- Ingen console.log i produktion
- Overholder UI-guidelines (semantic farver, responsive design)
- Overholder tekniske specs (ingen produktions-logging)
