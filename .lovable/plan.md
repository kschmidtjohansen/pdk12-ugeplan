

## Fix: Ryd TanStack Query-cache og service-caches ved logout

### Problem
Naar bruger A (Kasper Johansen, Super Admin) logger ud og bruger B (Michael Rattenborg) logger ind, vises stadig cached data fra bruger A's session. Dette sker fordi:

1. `queryClient` er oprettet som en modul-singleton i `App.tsx` (linje 46) og ryddes ALDRIG ved logout
2. `logout()` i `AuthContext.tsx` (linje 617-640) rydder kun `sessionStorage` - ikke React Query-cachen
3. Service-caches (`unifiedDataService`, `OptimizedAssignmentService`, `enhancedDataFetching`) ryddes heller ikke

### Loesning
Ryd ALLE caches ved logout: TanStack Query-cache, unifiedDataService, OptimizedAssignmentService og enhancedDataFetching.

### Aendringer

**`src/context/AuthContext.tsx`**

1. Importer `useQueryClient` fra `@tanstack/react-query`
2. Importer service-caches:
   - `unifiedDataService` fra `@/services/data/unifiedDataService`
   - `OptimizedAssignmentService` fra `@/services/optimizedAssignmentService`
   - `enhancedDataFetching` fra `@/services/enhancedDataFetching`
3. Hent `queryClient` via `useQueryClient()` i AuthProvider
4. I `logout`-funktionen (efter `supabase.auth.signOut()`), tilfoej:

```text
// Ryd alle data-caches for at undgaa data-laekning mellem brugere
queryClient.clear();
unifiedDataService.clearCache();
OptimizedAssignmentService.clearCache();
enhancedDataFetching.clearCache();
```

**`CHANGELOG.md`** - Dokumenter rettelsen.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/context/AuthContext.tsx` | Ryd queryClient + service-caches ved logout |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Ingen cached data fra bruger A vises efter login som bruger B
- `queryClient.clear()` fjerner baade aktive og inaktive queries
- Service-caches ryddes eksplicit for at undgaa stale data
- Ingen console.log uden DEV-guard
- Ingen hardcoded gray-farver tilfojes

