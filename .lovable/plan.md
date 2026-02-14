

## Aendringer

### 1. DepartmentSelector: "Afd. XX" i stedet for bare nummeret

**Fil:** `src/components/Layout/NavComponents/DepartmentSelector.tsx`

Aendr `getShortName`-funktionen fra at returnere kun nummeret (f.eks. "12") til at returnere "Afd. 12":

```typescript
const getShortName = (name: string) => {
  const num = name.split('-')[0]?.trim();
  return num ? `Afd. ${num}` : name;
};
```

Ingen andre aendringer i filen.

---

### 2. Ny "Gitter" (Grid) visning i Planner

#### 2a. Udvid viewMode-typen (PlannerPage.tsx)

- Aendr state-typen fra `'standard' | 'compact'` til `'standard' | 'compact' | 'grid'`
- Opdater localStorage-laesning til ogsaa at acceptere `'grid'`
- Tilfoej et tredje `ToggleGroupItem` med `value="grid"`, ikon `LayoutGrid` og tekst "Gitter"
- Flyt `LayoutGrid`-ikonet fra Standard-knappen til Grid-knappen. Standard faar f.eks. `Rows3` eller `List` i stedet
- "Udvid alle"-knappen vises for baade `standard` og `grid` (begge bruger DaySection med fold-ud/fold-sammen)

#### 2b. Tilfoej grid-visning i PlannerContent.tsx

- Udvid `viewMode` prop-typen til `'standard' | 'compact' | 'grid'`
- Tilfoej en tredje gren i render-logikken for `viewMode === 'grid'`:
  - Genbrug `CurrentAndFutureDays` og `PastAssignments` (samme som standard)
  - Send en ny prop `gridLayout={true}` til disse komponenter

#### 2c. Aendr DaySection.tsx til at understoette grid-layout

- Tilfoej en valgfri prop `gridLayout?: boolean`
- Naar `gridLayout` er `true`, aendr grid-klassen paa opgave-containeren:

```text
Standard:  grid-cols-1
Grid:      grid-cols-1 md:grid-cols-2 xl:grid-cols-3
```

- AssignmentCard bruges som den er -- kortet er allerede responsivt. Det kompakte layout opnaas naturligt naar kortene staar side om side i et grid.

#### 2d. Propper DaySection-aendringen igennem CurrentAndFutureDays og PastAssignments

- Tilfoej `gridLayout?: boolean` prop til begge komponenter
- Send den videre til `DaySection`

---

### Filer der aendres

| Fil | Aendring |
|-----|----------|
| `src/components/Layout/NavComponents/DepartmentSelector.tsx` | `getShortName` returnerer "Afd. XX" |
| `src/pages/PlannerPage.tsx` | Udvid viewMode til 3 tilstande, tilfoej "Gitter"-knap |
| `src/components/Planner/PlannerContent.tsx` | Haandter `grid` viewMode |
| `src/components/Planner/DaySection.tsx` | Tilfoej `gridLayout` prop for multi-kolonne grid |
| `src/components/Planner/CurrentAndFutureDays.tsx` | Videresend `gridLayout` prop |
| `src/components/Planner/PastAssignments.tsx` | Videresend `gridLayout` prop |

### Teknisk opsummering

```text
Toolbar:
  [Standard]  [Gitter]  [Kompakt]  [Udvid alle]

Standard-visning:
  Dag-header
    [ Opgave-kort (fuld bredde) ]
    [ Opgave-kort (fuld bredde) ]

Gitter-visning:
  Dag-header
    [ Opgave-kort ] [ Opgave-kort ] [ Opgave-kort ]
    [ Opgave-kort ] [ Opgave-kort ]

Kompakt-visning:
  Tabel-raekker (uaendret)
```

- localStorage persisterer valget (`'grid'` tilfojet)
- Mobil: Gitter-visning falder automatisk ned til 1 kolonne via `grid-cols-1`
- Alle data (tid, sted, medarbejdere, biler) forbliver synlige
- Eksisterende Standard og Kompakt views aendres ikke

