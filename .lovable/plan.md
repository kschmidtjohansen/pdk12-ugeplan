
## Plan: Filtrer live-data fra demo-bilvisning + Changelog

### Problem

`demo.cars` tabellen indeholder 15 biler: 12 gamle produktionsbiler (created_at = 2024-01-01) fra 12-Fredericia og 3 rigtige demo-biler (created_at = 2025-10-23). RPC'en `get_demo_cars_with_security` returnerer ALLE biler fra `demo.cars` uden filtrering, og frontend-koden viser dem alle.

### Loesning

Filtrer de returnerede demo-biler i `useCarData.ts` saa kun biler oprettet efter 2025-10-23 vises. Dette matcher det eksisterende moenster der tidligere blev brugt til at adskille baseline-data fra demo-data.

### AEndringer

| Fil | AEndring |
|-----|---------|
| `src/hooks/car/useCarData.ts` | Tilfoej datofilter paa demo-biler: `created_at >= '2025-10-23'` |
| `CHANGELOG.md` | Tilfoej entry om demo-data filtrering |

### Teknisk detalje

I `useCarData.ts`, linje 30, aendr fra:

```tsx
let baseline = (data || []).filter((c: any) => c.show_in_planner !== false) as CarData[];
```

Til:

```tsx
const DEMO_BASELINE_DATE = '2025-10-23T00:00:00Z';
let baseline = (data || []).filter((c: any) => 
  c.show_in_planner !== false && 
  new Date(c.created_at) >= new Date(DEMO_BASELINE_DATE)
) as CarData[];
```

Dette filtrerer de 12 gamle produktionsbiler fra og viser kun de 3 rigtige demo-biler plus eventuelle lokalt oprettede demo-biler.

### Changelog-tilfoejelse

Under `Security - 2026-02-14`:
- Demo-bilvisning filtrerer nu korrekt gamle produktionsdata fra `demo.cars` (kun biler oprettet efter baseline-dato vises)
