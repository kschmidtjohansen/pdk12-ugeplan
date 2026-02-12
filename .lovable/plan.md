

## Plan: Supabase Realtime-synkronisering for manglende hooks

### Status nu

Flere data-hooks har allerede realtime-abonnementer:
- **useEmployeeData** - lytter paa `profiles` + `user_roles`
- **useCarData** - lytter paa `cars`
- **useDutyData** - lytter paa `on_call_duties`
- **useVacationData** - lytter paa `vacations` (via realtimeManager)
- **useWarehouseData** - lytter paa `warehouse_items`

### Mangler realtime

| Hook | Brugt af | Mangler |
|------|----------|---------|
| `useOptimizedAssignments` | PlannerPage (Ugeplan) | Ingen realtime-lytning paa `assignments` |
| `useUnifiedData` | PlannerContent, Dashboard | Lytter kun paa `cars`, mangler `assignments` og `profiles` |
| `useAssignments` (data/) | Dashboard (MineOpgaver) | Ingen realtime overhovedet |

### AEndringer

**1. `src/hooks/useOptimizedAssignments.ts`**

Tilfoej realtime-abonnement i en ny `useEffect` efter den eksisterende mount-effect (linje 847-851):

- Opret `supabase.channel()` der lytter paa `assignments` tabellen (INSERT, UPDATE, DELETE)
- Debounce callbacks med 1 sekund for at undgaa rapid-fire refetches
- Ryd op med `supabase.removeChannel()` ved unmount
- Spring over i demo mode (bruger allerede optimistiske opdateringer)
- Ved fejl: log til konsol, fald tilbage paa eksisterende data (ingen crash)

**2. `src/hooks/data/useUnifiedData.ts`**

Udvid det eksisterende channel (linje 90-108) til ogsaa at lytte paa `assignments` og `profiles`:

- Tilfoej `.on('postgres_changes', ... table: 'assignments')` og `.on('postgres_changes', ... table: 'profiles')` til den eksisterende kanal
- Behold den eksisterende debounce-logik (clear cache + refetch)
- Ingen aendring i data-formatering eller visning

**3. `src/hooks/data/useAssignments.ts`**

Tilfoej realtime-abonnement:

- Opret `supabase.channel()` der lytter paa `assignments`
- Debounce med 1 sekund
- Ryd op ved unmount
- Fald tilbage paa eksisterende data ved fejl

### Sikkerhedsgarantier

- Eksisterende fetch-logik forbliver uaendret - realtime trigger kun en refetch
- Ingen aendring i data-formatering eller visning
- Alle channels ryddes op med `removeChannel()` ved unmount
- Debounce forhindrer rapid-fire refetches
- Ved channel-fejl: data forbliver i hukommelsen, ingen crash
- `isMounted`-flag forhindrer state-opdateringer efter unmount

### Tekniske detaljer

```text
Realtime flow:
  DB aendring --> Supabase Realtime --> Channel callback
                                           |
                                    debounce (1s)
                                           |
                                    clearCache() + refetch()
                                           |
                                    setState (kun hvis mounted)
```

| Fil | AEndring |
|-----|---------|
| `src/hooks/useOptimizedAssignments.ts` | Ny useEffect med realtime paa `assignments` |
| `src/hooks/data/useUnifiedData.ts` | Udvid kanal med `assignments` + `profiles` |
| `src/hooks/data/useAssignments.ts` | Ny useEffect med realtime paa `assignments` |

