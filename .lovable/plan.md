

## Plan: 3 rettelser

### 1. Opgaver-metric fejl (RPC funktion overload konflikt)

**Rodaarsag:** Migrationen oprettede en ny version af `list_accessible_assignments_with_team` med 2 parametre (`p_department_id`, `p_sub_department_id`), men den gamle version med kun 1 parameter (`p_department_id`) eksisterer stadig. PostgREST kan ikke vaelge mellem dem naar kun 1 parameter sendes.

Derudover kalder `enhancedDataFetching.ts` (linje 430) stadig RPC'en med kun `p_department_id: null` uden `p_sub_department_id`.

**Loesning:**
- **SQL migration:** Drop den gamle funktion med 1 parameter: `DROP FUNCTION IF EXISTS public.list_accessible_assignments_with_team(uuid);` saa kun versionen med 2 parametre (`p_department_id uuid, p_sub_department_id uuid`) eksisterer.
- **`src/services/enhancedDataFetching.ts` (linje 430):** Tilfoej `p_sub_department_id: null` til RPC-kaldet saa begge parametre altid sendes.

**Filer:**
| Fil | AEndring |
|-----|---------|
| Ny SQL migration | Drop den gamle 1-parameter funktion |
| `src/services/enhancedDataFetching.ts` | Tilfoej `p_sub_department_id: null` til RPC-kald (linje 430) |

---

### 2. Mobilversionen af sags-popup cropper forkert

**Problem:** `AssignmentDetailsDialog` bruger et 2-kolonne layout (`flex-col lg:flex-row`) der paa mobil stabler kolonnerne vertikalt. Med `max-h-[90vh]` og `overflow-hidden` kan vigtige detaljer som medarbejdere og biler blive afskaret paa smaa skaerme.

**Loesning:**
- AEndr `max-h-[90vh]` til `max-h-[95vh]` paa mobil for mere plads
- Tilfoej `overflow-y-auto` paa den ydre container saa hele indholdet kan scrolles
- Paa mobil (`flex-col`): giv detalje-kolonnen en min-height saa medarbejdere og biler altid er synlige
- Flyt de vigtigste info (medarbejdere, biler) hoejere op i layoutet paa mobil - placer dem lige under titel/adresse foer dato/tid sektionen

**Fil:** `src/components/Dashboard/AssignmentDetailsDialog.tsx`

**Specifikke aendringer:**
- Linje 112: AEndr `max-h-[90vh]` til `max-h-[95dvh]` (dynamic viewport height for mobil)
- Linje 145: Tilfoej `overflow-y-auto` paa den ydre flex container
- Omorganiser rækkefølgen paa mobil saa biler og medarbejdere vises foer dato/tid

---

### 3. Underafdelings-vaelger ved redigering af bil

**Problem:** `CarFormDialog` har ingen underafdelings-vaelger. Naar man redigerer en bil, kan man ikke aendre hvilken underafdeling den tilhoerer. `useCarFormState.initFormWithCar()` kopierer heller ikke `sub_department_id` fra bilens data.

**Loesning:**
- **`src/components/Cars/CarFormDialog.tsx`:** Tilfoej en underafdelings-dropdown (Select komponent) der viser tilgaengelige underafdelinger fra `useDepartment().userSubDepartments`. Feltet vises kun naar der er underafdelinger. Ved redigering forudvaelges bilens nuvaerende `sub_department_id`.
- **`src/components/Cars/types.ts`:** Sikr at `CarFormData` har `sub_department_id` feltet (allerede tiloejet i tidligere migration).
- **`src/hooks/car/useCarFormState.ts`:** Opdater `initFormWithCar` (linje 62-76) til at inkludere `sub_department_id: car.sub_department_id || null` og `handleCreateNew` til at saette `sub_department_id: null`.
- **`src/services/carSecurityService.ts`:** Allerede haandterer `sub_department_id` i `updateCar` - ingen aendring nødvendig her.

**Filer:**
| Fil | AEndring |
|-----|---------|
| `src/components/Cars/CarFormDialog.tsx` | Tilfoej Select for underafdeling (kun synlig naar underafdelinger eksisterer) |
| `src/hooks/car/useCarFormState.ts` | Tilfoej `sub_department_id` til `initFormWithCar` og `handleCreateNew` |
| `src/components/Cars/types.ts` | Verificer at `sub_department_id` er i `CarFormData` |

