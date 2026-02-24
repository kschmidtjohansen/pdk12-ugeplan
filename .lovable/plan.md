

## Fix: Lagerlokation viser ID + manglende oversaettelse i Biler

### Problem 1: Lagerlokation viser ID i stedet for navn

`WarehouseTableRow` og `MobileWarehouseCard` har begge en `useLocationLabel`-hook der laeser fra localStorage. Hooken matcher korrekt paa `l.key === hallId` og returnerer `l.label`. Hvis localStorage-data ikke er tilgaengelig (f.eks. anden browser, ryddet cache, eller localStorage-data endnu ikke oprettet), falder den tilbage til at vise raa `hallId` (f.eks. `hal_1` i stedet for `Hal 1`).

**Rodaarsag**: localStorage er ikke reaktiv -- aendringer fra `LocationManagement` triggerer ikke re-render i warehouse-komponenterne. Desuden er localStorage per-browser, saa hvis en admin opretter lokationer paa en enhed, ser andre brugere dem ikke.

**Loesning**: Da lokationsdata gemmes i localStorage (jf. Knowledge/memory), og vi ikke aendrer denne arkitektur, sikrer vi at:
1. Hook-logikken er korrekt (den er allerede)
2. Vi tilbyder en mere robust fallback -- viser hall-vaerdien formateret (erstatter underscore med mellemrum og capitalize) i stedet for den raa noegle

### Problem 2: `common.showMore` mangler i oversaettelser

`MobileCarCard.tsx` (linje 206) bruger `t('common.showMore')` med fallback `'Vis detaljer'`. Men `showMore` og `showLess` eksisterer KUN i `planner`-oversaettelserne, ikke i `common`. Tilsvarende mangler `common.showLess`.

---

### AEndringer

#### Fil 1: `src/translations/da/common.ts`
Tilfoej manglende noeger:
```
showMore: "Vis detaljer",
showLess: "Skjul detaljer",
```

#### Fil 2: `src/translations/en/common.ts`
Tilfoej manglende noeger:
```
showMore: "Show details",
showLess: "Hide details",
```

#### Fil 3: `src/components/Warehouse/WarehouseTableRow.tsx`
Forbedre `useLocationLabel` fallback: Naar lokationsdata ikke kan findes i localStorage, formater `hallId` laesevenligt (capitalize, erstatter `_` med mellemrum) i stedet for at vise den raa noegle.

```typescript
// Forbedret fallback i stedet for raa hallId:
const formatFallback = (id: string) => 
  id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
```

#### Fil 4: `src/components/Warehouse/MobileWarehouseCard.tsx`
Samme forbedring af `useLocationLabel` fallback.

#### Fil 5: `CHANGELOG.md`
Dokumenter begge rettelser.

---

### Tekniske detaljer

| Fil | AEndring |
|-----|---------|
| `src/translations/da/common.ts` | Tilfoej `showMore`, `showLess` |
| `src/translations/en/common.ts` | Tilfoej `showMore`, `showLess` |
| `src/components/Warehouse/WarehouseTableRow.tsx` | Forbedret location-fallback formatering |
| `src/components/Warehouse/MobileWarehouseCard.tsx` | Forbedret location-fallback formatering |
| `CHANGELOG.md` | Dokumenter rettelser |

### Kvalitetstjek
- Lagerlokationer viser laesbare navne (fra localStorage hvis tilgaengelig, ellers formateret fallback)
- `common.showMore` og `showLess` oversat korrekt paa baade dansk og engelsk
- Overholder UI-guidelines (ingen visuelle brud)
- Overholder tekniske specifikationer (ingen foelsom logging)

