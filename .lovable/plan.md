

## Plan: Datoformat med ugenummer i ferielisten

Opdater datoformatet i alle tre feriekomponenter til: **Fredag 25.3.2026 (Uge 11)** — stor begyndelsesbogstav, punktum-separeret dato, og ugenummer i parentes.

### Ændringer

#### 1. `src/components/Vacation/VacationTable.tsx`
Erstat `Intl.DateTimeFormat` med `date-fns` for konsistent formatering:
```typescript
import { format, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';

const formatDateWithWeek = (date: Date) => {
  const locale = currentLanguage === 'da' ? da : undefined;
  const weekday = format(date, 'EEEE', { locale });
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const dateStr = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  const week = getISOWeek(date);
  const weekLabel = currentLanguage === 'da' ? 'Uge' : 'Week';
  return `${capitalized} ${dateStr} (${weekLabel} ${week})`;
};
```

#### 2. `src/components/Vacation/EnhancedVacationCard.tsx`
Samme formatlogik i `formatDate`.

#### 3. `src/components/Vacation/VacationCard.tsx`
Samme formatlogik for `startDate`/`endDate` og `created_at`.

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Vacation/VacationTable.tsx` | Nyt datoformat med ugenummer |
| `src/components/Vacation/EnhancedVacationCard.tsx` | Nyt datoformat med ugenummer |
| `src/components/Vacation/VacationCard.tsx` | Nyt datoformat med ugenummer |

