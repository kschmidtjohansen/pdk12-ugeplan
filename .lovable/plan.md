

## Plan: 3 rettelser - Biler og Ferie

### 1. Bil forsvinder fra listen efter oprettelse/redigering

**Aarsag:** `fetchCars` i `carSecurityService.ts` (linje 25-37) filtrerer nu via junction-tabellen `car_sub_departments`. Naar en bil oprettes uden at vaelge underafdelinger i checkbox-listen, oprettes ingen raekker i junction-tabellen. Bilen forsvinder derfor fra listen naar man ser en specifik underafdeling.

Derudover saetter `useCarData.ts` (linje 109) stadig `sub_department_id: selectedSubDepartmentId` paa den gamle kolonne, men `fetchCars` bruger ikke laengere denne kolonne til filtrering.

**Loesning:**
- Tilfoej validering i `CarFormDialog.tsx` saa man IKKE kan gemme uden at vaelge mindst en underafdeling (naar underafdelinger er tilgaengelige).
- Deaktiver Gem-knappen og vis en fejlbesked naar ingen underafdeling er valgt.
- Fjern den gamle `sub_department_id` fra `createCar` i `useCarData.ts` (linje 109), da junction-tabellen nu haandterer relationen.

**Filer:**
| Fil | AEndring |
|-----|---------|
| `src/components/Cars/CarFormDialog.tsx` | Tilfoej validering: kræv mindst 1 underafdeling |
| `src/hooks/car/useCarData.ts` | Fjern gammel `sub_department_id` fra enrichedData |

---

### 2. Kasper fremgaar ikke af ferie-medarbejderlisten

**Aarsag:** Kaspers `home_department_id` er `8c542620...` (12 - Fredericia), men han har `user_access`-records for department `de10b9d0...` (02 - Storkoebenavn) med sub_department `5931531c...` (Fugt og Skimmel). 

I `useEmployeeData.ts` (linje 130-148) inkluderes super_admins KUN hvis `home_department_id === selectedDepartmentId`. Da Kaspers home department er Fredericia, bliver han IKKE inkluderet i employee-listen for 02 - Storkoebenavn, selvom han har user_access records der. 

Naar `AdminVacationFormDialog` faar `employees` listen, er Kasper allerede filtreret fra.

Derudover filtrerer `emp.id !== user?.id` (linje 102) den inloggede bruger vaek - hvis man ER Kasper, kan man ikke vaelge sig selv.

**Loesning:**
- I `useEmployeeData.ts` (linje 140-148): AEndr super_admin logikken saa den ogsaa inkluderer super_admins der har `user_access` records for den valgte afdeling (ikke kun baseret paa `home_department_id`). Kasper har jo allerede `user_access` for department de10b9d0, saa han burde inkluderes via `departmentUserIds.has(emp.id)` paa linje 141.

Vent - linje 141 checker `departmentUserIds.has(emp.id)` FOERST. Kasper HAR user_access for department de10b9d0 (med sub-departments). Saa `departmentUserIds` BURDE indeholde hans ID. Men user_access-queryen (linje 131-134) filtrerer kun paa `department_id` - lad mig tjekke om Kaspers user_access records for 02-Storkoebenavn har department_id sat korrekt... Ja, de har. Saa problemet maa vaere andet.

Det egentlige problem: `useEmployeeData` query (linje 131-134) henter `user_access` med `eq('department_id', selectedDepartmentId)`. Kasper har records med `department_id = de10b9d0` for 02-Storkoebenavn. Saa `departmentUserIds` SKAL indeholde `93b5374d...`. Linje 141: `departmentUserIds.has(emp.id)` returnerer `true` for Kasper. Han burde vaere inkluderet.

MEN - er Kasper overhovedet i `profiles` listen? Linje 84-91 henter alle profiler. Kasper er i profiles. Saa han burde vaere i `transformedEmployees`. Og `departmentUserIds.has(emp.id)` er true. Saa han BURDE vaere i `departmentFilteredEmployees`.

Problemet maa vaere i `AdminVacationFormDialog`: `emp.id !== user?.id` (linje 102). Hvis den inloggede bruger ER Kasper, filtreres han vaek. Det er det sandsynligste scenarie.

**Revideret loesning:**
- Fjern `emp.id !== user?.id` filteret fra `AdminVacationFormDialog`. Admin-formularen er specifikt til at ansoege paa vegne af andre, men der er ingen grund til at udelukke den inloggede bruger - de kan ogsaa have brug for at en anden admin registrerer fri for dem.

**Fil:** `src/components/Vacation/AdminVacationFormDialog.tsx`
- Linje 101-102: Fjern `&& emp.id !== user?.id` fra begge filtreringer (linje 101 og 110)

---

### 3. PENDING_ADMIN_APPROVAL (allerede rettet i databasen)

Databasequeryen viser ingen biler med `PENDING_ADMIN_APPROVAL` laengere - den forrige migration har ryddet op. `can_view_fuel_codes()` er ogsaa opdateret. Denne del er allerede loest.

---

### Tekniske detaljer

#### CarFormDialog - validering:
```tsx
const hasSubDepartments = userSubDepartments.length > 0;
const noSubDeptSelected = hasSubDepartments && (!formData.sub_department_ids || formData.sub_department_ids.length === 0);

// I DialogFooter:
<Button 
  type="submit"
  disabled={noSubDeptSelected}
  className="bg-polygon-blue hover:bg-polygon-darkblue"
>
  {isEditing ? t('common.save') : t('common.add')}
</Button>

// Vis fejlbesked:
{noSubDeptSelected && (
  <p className="text-sm text-destructive">{t('cars.selectAtLeastOneSubDepartment')}</p>
)}
```

#### useCarData - fjern gammel sub_department_id:
Linje 106-110, fjern `sub_department_id`:
```tsx
const enrichedData = {
  ...carData,
  department_id: selectedDepartmentId || null,
};
```

#### AdminVacationFormDialog - fjern selv-ekskludering:
Linje 101: `subDeptUserIds.has(emp.id)` (uden `&& emp.id !== user?.id`)
Linje 110: `employees` uden filter (eller behold kun active-status filter)

#### Oversaettelser:
**da/cars.ts:** `selectAtLeastOneSubDepartment: "Vaelg mindst en underafdeling"`
**en/cars.ts:** `selectAtLeastOneSubDepartment: "Select at least one sub-department"`

### Samlet filliste

| Fil | AEndring |
|-----|---------|
| `src/components/Cars/CarFormDialog.tsx` | Tilfoej validering for mindst 1 underafdeling |
| `src/hooks/car/useCarData.ts` | Fjern gammel sub_department_id fra enrichedData |
| `src/components/Vacation/AdminVacationFormDialog.tsx` | Fjern self-exclusion filter |
| `src/translations/da/cars.ts` | Tilfoej selectAtLeastOneSubDepartment |
| `src/translations/en/cars.ts` | Tilfoej selectAtLeastOneSubDepartment |

