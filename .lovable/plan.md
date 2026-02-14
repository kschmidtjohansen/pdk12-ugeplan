

## Ændringer

### 1. Beskrivelse som punktopstilling (over 10 tegn)

**Fil:** `src/components/Planner/AssignmentCard.tsx` (linje 249-251)

Når `assignment.description` er længere end 10 tegn, vises den som en forkortet punktopstilling i stedet for fuld tekst. Brugeren kan klikke på kortet for at se hele beskrivelsen i detaljevisningen.

- Split beskrivelsen på linjeskift (`\n`) og/eller punktum/semikolon for at skabe punkter
- Vis kun de første 2-3 punkter med "..." hvis der er flere
- Hvis beskrivelsen er 10 tegn eller kortere, vises den som nu (enkelt linje)
- Implementering:
  ```
  Hvis description.length > 10:
    - Split på "\n" (linjeskift)
    - Vis som <ul> med <li> elementer
    - Begræns til maks 3 punkter + "..." indikator
  Ellers:
    - Vis som almindelig <p> tekst (nuværende opførsel)
  ```

### 2. Grid-layout: 3 kolonner i stedet for 2

**Fil:** `src/components/Planner/DaySection.tsx` (linje 111)

Ændr grid-klasserne fra `md:grid-cols-2 xl:grid-cols-3` til `md:grid-cols-3` så der altid vises 3 kolonner på desktop (medium+).

### 3. Persistering af viewMode — allerede implementeret

ViewMode gemmes allerede i `localStorage` i `PlannerPage.tsx` (linje 56-58 og linje 89-91). Ingen yderligere ændringer nødvendige.

---

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Planner/AssignmentCard.tsx` | Beskrivelse som punktopstilling når > 10 tegn |
| `src/components/Planner/DaySection.tsx` | Grid ændret til 3 kolonner (md:grid-cols-3) |

### Ingen ændringer
- Punkt 3 (gem viewMode) er allerede på plads via localStorage

