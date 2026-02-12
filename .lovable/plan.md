

## Plan: Robust fejlhaandtering og Error Boundaries

### Nuvaerende tilstand

**Error boundaries der findes:**
- `SecurityErrorBoundary` - wrapper around MainLayout (fanger auth/security fejl)
- `DashboardErrorBoundary` - eksisterer men bruges IKKE noget sted
- `DataFetchErrorBoundary` - bruges kun af ScreenDisplayPage
- `ErrorBoundary` (generisk) - har en fejl: default fallback re-renderer children, hvilket kan give uendelig loop

**Sider UDEN error boundary:**
- DashboardPage, PlannerPage, EmployeesPage, CarsPage, VacationPage, DutyPage, WarehousePage, ChangeLogPage, AdminPage

**Supabase-kald:** Alle hooks har allerede try-catch med toast-beskeder. Ingen aendringer noevendige her.

**QueryClient:** Har retry:1, men ingen global mutation error handler.

---

### AEndringer

**1. Ny `src/components/ErrorBoundary/GlobalErrorBoundary.tsx`**

Opret en top-level error boundary med brugervenlig UI der matcher appens design-system:
- Viser fejlikon, titel og beskrivelse paa dansk/engelsk (browser language detection)
- "Proev igen" knap (reset error state)
- "Genindlaes side" knap (window.location.reload)
- Error details i collapsible sektion (kun development)
- Logger fejl til konsol

**2. Opdater `src/App.tsx`**

Wrap `AppContent` med `GlobalErrorBoundary` saa INGEN fejl kan resultere i hvid skaerm:

```text
App
  -> QueryClientProvider
    -> ThemeProvider
      -> TranslationProvider
        -> ...providers...
          -> GlobalErrorBoundary    <-- NY
            -> AppContent
```

Tilfoej ogsaa en global `MutationCache` error handler til QueryClient, saa uhaandterede mutation-fejl viser en toast automatisk.

**3. Opdater `src/components/ErrorBoundary.tsx`**

Fix den generiske ErrorBoundary: default fallback skal vise en fejlbesked i stedet for at re-rendere children (som kan give uendelig loop).

**4. Wrap hver side-komponent med `DataFetchErrorBoundary`**

Tilfoej `DataFetchErrorBoundary` i foelgende page-filer:

| Side | Fil |
|------|-----|
| DashboardPage | `src/pages/DashboardPage.tsx` |
| PlannerPage | `src/pages/PlannerPage.tsx` |
| EmployeesPage | `src/pages/EmployeesPage.tsx` |
| CarsPage | `src/pages/CarsPage.tsx` |
| VacationPage | `src/pages/VacationPage.tsx` |
| DutyPage | `src/pages/DutyPage.tsx` |
| WarehousePage | `src/pages/WarehousePage.tsx` |
| ChangeLogPage | `src/pages/ChangeLogPage.tsx` |
| AdminPage | `src/pages/AdminPage.tsx` |

Hver side wrapper sit indhold i `<DataFetchErrorBoundary>` med retry-funktionalitet.

---

### Tekniske detaljer

**GlobalErrorBoundary UI:**
- Bruger eksisterende Card, Button, AlertTriangle fra design-systemet
- Gradient baggrund matchende appens theme (`from-gray-25 via-background to-gray-50`)
- "Proev igen" + "Genindlaes side" knapper
- Error details bag `<details>` tag

**QueryClient MutationCache:**
```text
new MutationCache({
  onError: (error) => {
    // Vis toast med fejlbesked (kun hvis ikke allerede haandteret)
    console.error('[MutationCache] Unhandled mutation error:', error);
  }
})
```

**Sikkerhedsgarantier:**
- Ingen succes-logik aendres
- Ingen console.log eller debugging fjernes
- Alle eksisterende try-catch og toast-beskeder bevares
- UI matcher eksisterende design-system
- Kun additive aendringer (nye wrappere, ny komponent)

| Fil | Type | AEndring |
|-----|------|---------|
| `src/components/ErrorBoundary/GlobalErrorBoundary.tsx` | NY | Top-level error boundary |
| `src/App.tsx` | OPDATER | Wrap med GlobalErrorBoundary + MutationCache |
| `src/components/ErrorBoundary.tsx` | OPDATER | Fix default fallback |
| `src/pages/DashboardPage.tsx` | OPDATER | Wrap med DataFetchErrorBoundary |
| `src/pages/PlannerPage.tsx` | OPDATER | Wrap med DataFetchErrorBoundary |
| `src/pages/EmployeesPage.tsx` | OPDATER | Wrap med DataFetchErrorBoundary |
| `src/pages/CarsPage.tsx` | OPDATER | Wrap med DataFetchErrorBoundary |
| `src/pages/VacationPage.tsx` | OPDATER | Wrap med DataFetchErrorBoundary |
| `src/pages/DutyPage.tsx` | OPDATER | Wrap med DataFetchErrorBoundary |
| `src/pages/WarehousePage.tsx` | OPDATER | Wrap med DataFetchErrorBoundary |
| `src/pages/ChangeLogPage.tsx` | OPDATER | Wrap med DataFetchErrorBoundary |
| `src/pages/AdminPage.tsx` | OPDATER | Wrap med DataFetchErrorBoundary |

