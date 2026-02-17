

## Fix: Lokationer vises ikke pga. property-navn mismatch

### Problem
`LocationManagement` gemmer lokationer i localStorage med properties `{ key, label }`, men `WarehouseFormDialog` laeser dem som `{ id, name }`. De to interfaces matcher ikke, saa lokationerne er usynlige.

### Loesning
Ret `useLocations`-hooket i `WarehouseFormDialog.tsx` til at mappe fra det korrekte format (`key`/`label`) til det forventede format (`id`/`name`). Samme rettelse i `WarehouseTableRow.tsx` og `MobileWarehouseCard.tsx`.

### Aendringer

#### 1. `src/components/Warehouse/WarehouseFormDialog.tsx` (linje 20-31)
Ret `useLocations`-hooket til at mappe properties korrekt:

```typescript
const useLocations = (departmentId: string | null): LocationItem[] => {
  return React.useMemo(() => {
    if (!departmentId) return [];
    try {
      const raw = localStorage.getItem(`location-data-${departmentId}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item: any) => ({
        id: item.key || item.id,
        name: item.label || item.name,
      }));
    } catch {
      return [];
    }
  }, [departmentId]);
};
```

#### 2. `src/components/Warehouse/WarehouseTableRow.tsx`
Ret den lokale lokations-lookup til at bruge `key`/`label` i stedet for `id`/`name` (eller mappe dem korrekt).

#### 3. `src/components/Warehouse/MobileWarehouseCard.tsx`
Samme rettelse som i WarehouseTableRow.

#### 4. `CHANGELOG.md`
Dokumenter fix af property-mismatch.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/components/Warehouse/WarehouseFormDialog.tsx` | Map `key`/`label` til `id`/`name` i useLocations |
| `src/components/Warehouse/WarehouseTableRow.tsx` | Samme mapping-fix |
| `src/components/Warehouse/MobileWarehouseCard.tsx` | Samme mapping-fix |
| `CHANGELOG.md` | Dokumenter rettelsen |

### Kvalitetstjek
- Lokationer oprettet i LocationManagement (admin) vises korrekt i lagerformularen
- Lokationsnavne vises korrekt i tabel og mobilkort
- Afdeling 14 ser kun sine egne lokationer, ikke afdeling 12s
