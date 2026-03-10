

## Plan: Vis ugedage ved datoer i ferielisten

### Beskrivelse

Tilføj ugedagsnavn (mandag, tirsdag osv.) til datovisningen i ferielisten på `/vacation`, både i desktop-tabellen og mobile kort.

### Ændringer

#### 1. `src/components/Vacation/VacationTable.tsx` — Desktop tabel

Opdater `formatDateRange` til at inkludere ugedagsnavn:
```typescript
const formatDateRange = (startDate: Date, endDate: Date) => {
  const locale = currentLanguage === 'da' ? 'da-DK' : 'en-GB';
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' };
  
  if (startDate.toDateString() === endDate.toDateString()) {
    return startDate.toLocaleDateString(locale, options);
  }
  return `${startDate.toLocaleDateString(locale, options)} - ${endDate.toLocaleDateString(locale, options)}`;
};
```

Resultat: "mandag 14/07/2025 - fredag 18/07/2025" i stedet for bare "14/07/2025 - 18/07/2025".

#### 2. `src/components/Vacation/EnhancedVacationCard.tsx` — Mobilkort

Opdater `formatDate` til at inkludere ugedag via `date-fns` format med `EEEE`:
```typescript
return format(date, 'EEEE dd/MM/yyyy', { locale });
```

#### 3. `src/components/Vacation/VacationCard.tsx` — Alternativt kort

Tilføj ugedagsformat via `date-fns` format med `EEEE`:
```typescript
const dateFormat = currentLanguage === 'da' ? 'EEEE dd.MM.yyyy' : 'EEEE MM/dd/yyyy';
```

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Vacation/VacationTable.tsx` | Tilføj ugedag i `formatDateRange` |
| `src/components/Vacation/EnhancedVacationCard.tsx` | Tilføj ugedag i `formatDate` |
| `src/components/Vacation/VacationCard.tsx` | Tilføj ugedag i datoformat |

