

## Fix: Car Selector lukker uden at vælge bil

### Problemanalyse

`MultipleCarSelector` bruger en Radix `Popover` inde i en Radix `Dialog`. Radix Dialog lytter efter pointer-events udenfor sit content og lukker nested popovers, fordi den opfatter klikket som "outside interaction". Resultatet: brugeren klikker pa en bil, Popover lukker, men `onClick` nar aldrig at fire.

### Losning

**`src/components/Planner/MultipleCarSelector.tsx`** (4 rettelser):

1. **Tilf0j `modal={false}`** pa Popover-komponenten -- dette forhindrer Radix i at "fange" focus og pointer-events, sa Dialog ikke interfererer med klik inde i Popover.

2. **Tilf0j `e.stopPropagation()`** pa alle klik-handlers for bil-elementer (bade div onClick og checkbox onChange) -- dette forhindrer klik-events fra at boble op til Dialog.

3. **Ret `bg-white` til `bg-popover`** pa PopoverContent -- overholder UI-guidelines for dark mode support.

4. **Ret hardcoded farver** (`bg-gray-50`, `text-gray-400`, `border-gray-200`, etc.) til Tailwind semantic tokens (`bg-muted`, `text-muted-foreground`, `border-border`, etc.) -- overholder design-system guidelines.

**`CHANGELOG.md`**: Dokumenter fix.

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/components/Planner/MultipleCarSelector.tsx` | `modal={false}`, `e.stopPropagation()`, semantic farver |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Klik pa bil i car selector vaelger bilen korrekt uden at lukke popover
- Popover lukker kun ved klik udenfor eller explicit lukning
- Fungerer korrekt bade i lys og mork tema
- Fungerer i Dialog-kontekst (opret/rediger opgave)
- Ingen console.log i produktion

