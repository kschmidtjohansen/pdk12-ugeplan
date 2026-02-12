

## Plan: Login afdelingsvælger + Demo super_admin department-skift

### Problem 1: Login-formularen har en afdelingsvælger der skal fjernes

**Årsag:** `EnhancedSecureLoginForm.tsx` viser en Select-komponent med alle afdelinger og kræver valg før login. Brugeren ønsker at afdelingen automatisk sættes baseret på `user_access`-tabellen efter login.

**Rettelse i `src/components/Auth/EnhancedSecureLoginForm.tsx`:**
- Fjern hele department selector UI-blokken (linje 183-211)
- Fjern valideringen `if (!selectedDepartmentId)` (linje 48-51)
- Fjern department-relaterede imports og state (`useDepartment`, `Building2`)
- Fjern department access check efter login (linje 104-121) - dette håndteres nu af DepartmentContext automatisk
- Behold al anden logik (email, password, attempts, timeout) uændret

### Problem 2: Auto-valg af afdeling efter login

**Årsag:** `DepartmentContext.tsx` auto-vælger kun afdeling når der er præcis 1 afdeling. Hvis brugeren har flere afdelinger og ingen er valgt i localStorage, forbliver `selectedDepartmentId` null.

**Rettelse i `src/context/DepartmentContext.tsx`:**
- Ændr auto-select logikken (linje 114 og 144): Hvis ingen afdeling er valgt i localStorage, vælg den første tilgængelige afdeling automatisk (ikke kun når der er præcis 1)
- Ændr `if (mapped.length === 1 && !selectedDepartmentId)` til `if (mapped.length > 0 && !selectedDepartmentId)`
- Samme ændring for non-super_admin brugere (linje 144)

### Problem 3: Demo mode super_admin kan ikke skifte afdeling

**Årsag:** `DepartmentContext.tsx` linje 97 bruger `user.role` til at afgøre om brugeren er super_admin. I demo mode er `user.role` altid den base-rolle der er gemt i databasen (typisk `administrator`). Demo-rolleskiftet sker via `demoRole` i AuthContext, men DepartmentContext kender ikke til `demoRole` eller `effectiveRole`.

**Rettelse i `src/context/DepartmentContext.tsx`:**
- Importér `effectiveRole` (eller beregn det via `isDemoMode` + `demoRole`) fra AuthContext
- I linje 97, ændr `const isSuperAdmin = user.role === 'super_admin'` til at bruge den effektive rolle:
  ```
  // Hent effectiveRole fra AuthContext (allerede tilgængelig)
  // Brug det i stedet for user.role
  ```
- Da AuthContext allerede eksporterer `effectiveRole`, kan vi tilføje det til destructured values fra `useAuth()`
- Ændr `useEffect` dependency array til også at inkludere effectiveRole, så department-listen genindlæses når demo-rollen skiftes

### Header-visning (allerede korrekt)

DepartmentSelector i TopNavbar og MobileNavigation fungerer allerede korrekt:
- Viser afdelingsnavn statisk ved 1 afdeling
- Viser dropdown ved flere afdelinger
- Ingen ændringer nødvendige her

---

### Tekniske detaljer

| Fil | Ændring |
|-----|---------|
| `src/components/Auth/EnhancedSecureLoginForm.tsx` | Fjern department selector UI, validation og access check |
| `src/context/DepartmentContext.tsx` | Auto-vælg første afdeling + brug effectiveRole for demo super_admin |

### Sikkerhedsgarantier
- Login-flowet forbliver sikkert (email/password validering, attempts, timeout uændret)
- Department-adgang kontrolleres stadig via RLS og user_access tabellen
- Super_admin adgang verificeres stadig server-side via user_roles tabellen
- Alle props, interfaces og UI-layout forbliver uændrede
- Oversættelser berøres ikke

