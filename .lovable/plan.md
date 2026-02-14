

## Ændring

### Beskrivelse: Maks 3 linjer, ingen punkter

**Fil:** `src/components/Planner/AssignmentCard.tsx` (linje 249-265)

Fjern den nuværende punktopstilling og erstat med en simpel `<p>` der begrænses til 3 linjer via CSS `line-clamp-3`. Brugeren kan klikke på kortet for at se den fulde beskrivelse.

Erstat hele description-blokken med:

```tsx
{assignment.description && (
  <p className="text-gray-600 mb-3 text-sm line-clamp-3">{assignment.description}</p>
)}
```

- `line-clamp-3` (Tailwind) afskærer teksten efter 3 linjer med "..." automatisk
- Ingen punktopstilling, ingen split-logik
- Virker for både korte og lange beskrivelser

### Fil der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Planner/AssignmentCard.tsx` | Fjern punktopstilling, brug `line-clamp-3` |

