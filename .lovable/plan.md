## Problem

Nick, Mads og Kasper har rollen **skadeleder + fugttekniker** og adgang til afdelingen Polygon Køge → underafdeling **Fugt** (kontrolleret i DB).

I `DepartmentContext` bliver ikke-admin brugere automatisk *låst* på deres første tildelte underafdeling, fordi `isAdminLike` kun dækker `administrator` og `super_admin`. Det betyder:

- Skadelederen kan kun se "Fugt" — aldrig "Alle".
- Knappen "+ Ny opgave" forsvinder ikke, men de kan ikke skifte til hoveddepartementets samlede visning.
- Samme effekt rammer al cross-sub-dept funktionalitet (oversigter, bytte mellem afdelinger).

Brugeren vil have at skadeledere (uanset hvilke yderligere roller de har) kan veksle frit mellem **Alle** og de underafdelinger de er tilknyttet.

## Løsning

Behandl `skadeleder` på samme måde som admin/super_admin i sub-department-navigationen — dvs. tillad NULL ("Alle") som gyldigt valg, uden at give dem adgang til andre underafdelinger end dem `user_access` faktisk indeholder.

### Ændringer

**1. `src/context/DepartmentContext.tsx`**
- Udvid `isAdminLike` i `fetchSubDepartments`-effekten til også at inkludere `effectiveRole === 'skadeleder'`. Resultat: stored value respekteres, default bliver NULL ("Alle") hvis intet er gemt.
- Behold den eksisterende `user_access`-baserede liste over sub-departments — skadeleder ser stadig kun de underafdelinger de er tildelt (f.eks. kun "Fugt"), men får nu også "Alle" som mulighed i selectoren.

**2. Sub-department selector i UI**
- Find komponenten der renderer sub-dept dropdown (typisk i `UserMenu` / `DepartmentSelector`) og sørg for at "Alle"-rækken (value=`null`) vises når `effectiveRole` er admin/super_admin/**skadeleder**. Hvis komponenten allerede styres af `isAdminLike`-flag eller en prop fra contexten, eksponer en `canSelectAllSubDepartments`-boolean fra `DepartmentContext` så UI'et ikke behøver kende rolle-logikken.

**3. Konsistens-tjek**
- Verificér at `useEmployees`, `useOptimizedAssignments`, `useCrossSubDeptBusy` og lignende hooks håndterer `selectedSubDepartmentId = null` korrekt for skadelederen (de gør det allerede for admins). Ingen DB-policy-ændring nødvendig — `user_access` afgør hvilke afdelinger der er synlige.

**4. Dokumentation**
- `CHANGELOG.md`: ny linje under 2026-06-16 "Skadeledere kan nu skifte mellem Alle og deres underafdelinger i department-selectoren."
- Opdater memory `mem://ui/department-selector-navigation` så reglen "kun admin må se Alle" rettes til "admin/super_admin/skadeleder".

### Ingen ændringer

- Ingen DB-migrationer.
- Ingen ændringer i RLS eller `user_access`-rækker.
- Servicemedarbejdere/fugtteknikere uden skadeleder-rolle forbliver låst på deres tildelte sub-dept (uændret).

### Test

1. Log ind som Nick Berg Hansen → afdelings-selector viser **Alle, Fugt**. Kan skifte frit.
2. På "Alle" er "+ Ny opgave"-knappen synlig (`canCreate` er allerede true pga. effective role = skadeleder). Oprettelse virker.
3. Servicemedarbejder uden skadeleder-rolle ser stadig kun deres ene sub-dept (ingen "Alle"-toggle).
