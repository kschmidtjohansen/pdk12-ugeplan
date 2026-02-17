

## Global State Reset ved Logout

### Problem
Ved logout ryddes TanStack Query cache og sessionStorage, men localStorage-noegler som `selected_department_id`, `selected_sub_department_id`, `selected_department_name` og diverse view-preferences overlever. Naar en ny bruger logger ind, laeser `DepartmentContext` den forrige brugers afdeling fra localStorage og viser forkerte data.

### Loesning

#### 1. `src/context/AuthContext.tsx` -- Udvid logout-funktionen (linje 622-651)

Tilfoej rydning af alle app-specifikke localStorage-noegler og tving en fuld page reload efter logout:

```typescript
const logout = async () => {
  try {
    manualLogoutRef.current = true;

    if (isDemoMode) {
      await demoService.cleanupDemoData();
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSessionExpired(false);

    // 1. TanStack Query -- ryd al cached data
    queryClient.clear();

    // 2. Service-caches
    unifiedDataService.clearCache();
    OptimizedAssignmentService.clearCache();
    enhancedDataFetching.clearCache();

    // 3. SessionStorage -- ryd alt
    sessionStorage.clear();

    // 4. LocalStorage -- ryd app-specifikke noegler (bevar theme)
    const keysToRemove = [
      'selected_department_id',
      'selected_department_name',
      'selected_sub_department_id',
      'selected_view',
      'last-redirect-time',
      'redirect-attempts',
    ];
    // Ryd ogsaa alle location-data noegler (dynamiske pr. afdeling)
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (keysToRemove.includes(key) || key.startsWith('location-data-')) {
        localStorage.removeItem(key);
      }
    }

  } catch (error) {
    console.error('[AuthProvider] Logout error:', error instanceof Error ? error.message : 'Unknown error');
    setUser(null);
    setSession(null);
    setSessionExpired(false);
  }
};
```

#### 2. `src/components/Layout/TopNavbar.tsx` -- Tving fuld page reload efter logout (linje 83-98)

Aendr `handleLogout` til at bruge `window.location.href` i stedet for `navigate()`, saa alle Contexts (DepartmentContext, NotificationContext osv.) geninitialiseres fra scratch:

```typescript
const handleLogout = async () => {
  try {
    await logout();
    // Fuld page reload saa alle contexts starter forfra
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    toast({
      title: t('common.error'),
      description: t('auth.logoutFailed'),
      variant: 'destructive'
    });
  }
};
```

#### 3. `CHANGELOG.md`

Dokumenter den globale state reset.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/context/AuthContext.tsx` | Ryd localStorage app-noegler ved logout |
| `src/components/Layout/TopNavbar.tsx` | Brug window.location.href i stedet for navigate |
| `CHANGELOG.md` | Dokumenter global state reset |

### Kvalitetstjek
- Ingen departmentId overlever logout (tjek localStorage i DevTools)
- Ny bruger ser kun sine egne afdelinger, ikke den forrige brugers
- Theme-indstilling (ui-theme) bevares paa tvaers af logout
- Ingen uendelig redirect-loop efter logout

