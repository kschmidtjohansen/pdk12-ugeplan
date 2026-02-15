

## Fase 9e: Fix demo-data RPCs + afdelingsvaeIger-layout

### Problem

Der er tre separate problemer:

**Problem 1: Biler/medarbejdere/lager vises ikke efter oprettelse i demo-mode**

Rodaarsagen er at 6 demo-RPCs (`get_demo_cars_with_security`, `get_demo_profiles_admin_detailed`, `get_demo_warehouse_items`, `get_demo_duties_with_employee`, `get_demo_vacations`, `list_demo_assignments_with_team`) laeser fra `demo.*`-schemaet, mens alle CRUD-operationer nu skriver til `public.*`-schemaet med `is_demo: true`. Data skrives eet sted og laeses fra et andet.

**Problem 2: Fejl naar man trykker paa Medarbejdere under afd. 02**

Medarbejder-data i demo-mode hentes via `get_demo_profiles_admin_detailed` som laeser fra `demo.profiles`. Nye demo-medarbejdere oprettet via UI ligger i `public.profiles` med `is_demo: true`, og RPC'en finder dem ikke. Desuden kan RPC'en fejle hvis `demo.profiles` eller `demo.user_roles` tabellerne har aendret struktur.

**Problem 3: Afdelingsvaelger-layout**

Brugeren oensker at hovedafdeling og underafdeling vises side om side (to separate elementer) i stedet for i en enkelt dropdown.

---

### Loesning

#### Del 1: Opdater alle 6 demo-RPCs til at laese fra `public` schema med `is_demo = true`

Hver RPC skal aendres fra `FROM demo.<table>` til `FROM public.<table> WHERE is_demo = true`.

| RPC | Nuvaerende kilde | Ny kilde |
|-----|-----------------|----------|
| `get_demo_cars_with_security` | `demo.cars` | `public.cars WHERE is_demo = true` |
| `get_demo_profiles_admin_detailed` | `demo.profiles` + `demo.user_roles` | `public.profiles WHERE is_demo = true` + `public.user_roles` |
| `get_demo_warehouse_items` | `demo.warehouse_items` | `public.warehouse_items WHERE is_demo = true` |
| `get_demo_duties_with_employee` | `demo.on_call_duties` + `demo.profiles` | `public.on_call_duties WHERE is_demo = true` + `public.profiles` |
| `get_demo_vacations` | `demo.vacations` | `public.vacations WHERE is_demo = true` |
| `list_demo_assignments_with_team` | `demo.assignments` + `demo.assignments_employees` + `demo.profiles` | `public.assignments WHERE is_demo = true` + tilsvarende public joins |

Dette sikrer at nyoprettede demo-data (med `is_demo = true` i public) vises korrekt.

SQL-migrering: En enkelt migration-fil der erstatter alle 6 funktioner med `CREATE OR REPLACE FUNCTION`.

#### Del 2: Fix realtime-schema i `useDutyData.ts`

Linje 101-106: Realtime-subscription bruger stadig `schema: isDemoMode ? 'demo' : 'public'`. Skal aendres til altid at bruge `schema: 'public'`.

Uguardede `console.log` paa linje 107-108 og 110-111 skal wraps i `import.meta.env.DEV`.

#### Del 3: Redesign afdelingsvaelger til side-by-side layout

**Fil**: `src/components/Layout/NavComponents/DepartmentSelector.tsx`

Nuvaerende: En enkelt dropdown-knap med baade afdelinger og underafdelinger i samme menu.

Ny: To separate elementer side om side:
- **Venstre**: Hovedafdeling-dropdown (eller statisk label hvis kun en afdeling)
- **Hoeyre**: Underafdeling-dropdown (eller statisk label hvis kun en underafdeling)

Layout: `flex items-center gap-1` med en separator (`/` eller `>`) mellem de to.

Eksempel-visning: `[Afd. 02 v]  >  [Fugt & Skimmel v]`

Begge er individuelle dropdowns hvis der er flere valg, eller statiske labels hvis der kun er et valg.

#### Del 4: Logging-oprydning

| Fil | Linjer | Handling |
|-----|--------|---------|
| `useDutyData.ts` | 107-108, 110-111 | Wrap i `import.meta.env.DEV` |
| `carSecurityService.ts` | 111, 187 | Wrap i `import.meta.env.DEV` |
| `useCarFormState.ts` | 117, 133, 137, 157, 164, 180 | Wrap i `import.meta.env.DEV` |
| `DepartmentContext.tsx` | 300, 307 | Wrap i `import.meta.env.DEV` |

#### Del 5: Dokumentation

- Opdater `CHANGELOG.md` med beskrivelse af RPC-fix, realtime-fix og afdelingsvaelger-redesign
- Opdater `docs/implementation-plan/tasks.md` med ny fase 9e

### Raekkefoelge

1. SQL-migrering: Opdater alle 6 demo-RPCs til `public` schema
2. Fix `useDutyData.ts` realtime-schema + logging
3. Fix logging i `carSecurityService.ts`, `useCarFormState.ts`, `DepartmentContext.tsx`
4. Redesign `DepartmentSelector.tsx` til side-by-side layout
5. Opdater `CHANGELOG.md` og `tasks.md`

### Kvalitetstjek

- Live-brugere forbliver beskyttet: RESTRICTIVE RLS-politikker paa `public` schema sikrer at `is_demo = true` data er usynligt for alle andre end demo-brugeren
- RPCs begraenset til demo-bruger via email-check (`test@polygongroup.com`)
- Ingen foelsom data logges
- Alle `console.log` i aendrede blokke wraps med `import.meta.env.DEV`
- Afdelingsvaelger fungerer i baade Standard og Kompakt visning og er fuldt responsiv

