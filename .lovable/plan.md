

## Plan: Super Admin metrics + CHANGELOG/README opdatering

### Problem 1: Super Admin ser ikke Medarbejdere og Biler i Quick Access

**Aarsag:** `QuickAccessGrid.tsx` linje 48 tjekker kun for `administrator` og `skadeleder` - `super_admin` mangler.

**Rettelse:** Tilfoej `super_admin` til betingelsen paa linje 48.

**Fil:** `src/components/Dashboard/QuickAccessGrid.tsx`
- Linje 48: AEndr `if (userRole === 'administrator' || userRole === 'skadeleder')` til `if (userRole === 'super_admin' || userRole === 'administrator' || userRole === 'skadeleder')`

Bemærk: `DashboardPage.tsx` linje 37 inkluderer allerede `super_admin` i `shouldShowMetrics`, saa selve metric-kortene (medarbejdere, biler, fravaer) vises korrekt. Problemet er kun Quick Access genvejene.

---

### Problem 2: WarehousePage mangler super_admin i canEdit

**Fil:** `src/pages/WarehousePage.tsx` linje 37
- AEndr `user?.role === 'administrator' || user?.role === 'skadeleder'` til ogsaa at inkludere `super_admin`

---

### Problem 3: ResponsibleUserSelector mangler super_admin

**Fil:** `src/components/Planner/ResponsibleUserSelector.tsx` linje 31
- Tilfoej `super_admin` til filter saa super_admins ogsaa kan vaelges som ansvarlige

---

### Opdatering 4: CHANGELOG.md

Tilfoej nye sektioner under `[Unreleased]` for alle aendringer siden sidst:

**Security - 2025-02-12:**
- Fjernet hardkodet demo-adgangskode fra kildekoden (nu via environment variabel)
- Haerdnet RLS-policies: on_call_duties UPDATE, assignment_messages/files SELECT, departments/sub_departments SELECT

**Fixed - 2025-02-12:**
- Lager-redigering i demo mode gemmes nu korrekt i hukommelsen
- Rolle-skift toast bruger nu korrekte oversaettelsesnoegler
- Super Admin ser nu samme dashboard-metrics og Quick Access som Administrator

**Added - 2025-02-12:**
- Lokationsstyring med inline-redigering og sletning i Admin-panelet
- Admin locations oversaettelser (da/en)

**Performance - 2025-02-12:**
- Reduceret Google Fonts vaegt (300-700 i stedet for 300-900)
- Fjernet render-blocking font preload
- Tilfojet inline kritisk CSS for loading spinner
- Dynamic import af performanceMonitor (kun i development)
- Fjernet ubrugt App.css indhold
- Tilfojet cache-headers for statiske assets

---

### Opdatering 5: README.md

Tilfoej `Super Admin` rolle i rolletabellen (baade dansk og engelsk sektion), da den mangler i dag:

| Super Admin | Global adgang til alle afdelinger og funktioner |

Tilfoej ogsaa en `Warehouse/Lager` feature-linje under features-listen.

---

### Tekniske detaljer

| Fil | AEndring |
|-----|---------|
| `src/components/Dashboard/QuickAccessGrid.tsx` | Tilfoej `super_admin` til linje 48 |
| `src/pages/WarehousePage.tsx` | Tilfoej `super_admin` til canEdit |
| `src/components/Planner/ResponsibleUserSelector.tsx` | Tilfoej `super_admin` til filter |
| `CHANGELOG.md` | Tilfoej alle nye aendringer |
| `README.md` | Tilfoej Super Admin rolle + lager feature |

Alle aendringer er atomiske og pavirker ikke eksisterende logik, oversaettelser eller UI-layout.

