

## Plan: 3 rettelser

### 1. Medarbejdere synlige i sags-dialog paa mobil

**Problem:** I `AssignmentDetailsDialog.tsx` vises medarbejdere og biler korrekt i HTML-strukturen, men paa mobil er dialog-indholdet for langt og den ydre container kan afskere indholdet foer medarbejder-sektionen. `order-first lg:order-none` klassen paa "Assignment Details"-sektionen virker kun paa flex-children, men sektionen er inde i en `ScrollArea` som allerede er inde i flex-containeren.

**Loesning:** Omorganiser rækkefølgen i mobilvisningen saa "Opgave detaljer"-sektionen (biler, sagsansvarlig, medarbejdere) vises FOER titel og beskrivelse paa mobil. Brug CSS `order` klasser til at flytte denne sektion op paa smaa skaerme. Derudover sikres at hele indholdet er scrollbart med `overflow-y-auto`.

**Fil:** `src/components/Dashboard/AssignmentDetailsDialog.tsx`
- Flyt "Assignment Details Section" (biler, sagsansvarlig, medarbejdere) op FOER beskrivelsen paa mobil ved at saette `order-first lg:order-none` paa den ydre `space-y-6` div og strukturere indholdet saa de vigtigste elementer kommer foerst.
- Alternativt: flyt hele sektionen op i HTML-raekkefoelgen, saa den altid vises lige efter titlen og foer separatoren til dato/tid.

---

### 2. Manglende oversaettelser for `common.subDepartment`

**Problem:** `t('common.subDepartment')` og `t('common.selectSubDepartment')` returnerer `undefined` fordi noeglerne ikke findes i oversaettelsesfilerne. Fallback-teksten `'Underafdeling'` bruges, men det er ikke ideelt.

**Loesning:** Tilfoej de manglende noegler til begge sprogsiler:

**Fil:** `src/translations/da/common.ts`
```
subDepartment: "Underafdeling",
selectSubDepartment: "Vaelg underafdeling",
```

**Fil:** `src/translations/en/common.ts`
```
subDepartment: "Sub-department",
selectSubDepartment: "Select sub-department",
```

---

### 3. Bil-oprettelse fejler pga. global unik constraint

**Problem:** Tabellen `cars` har globale unikke constraints paa `car_number`, `number_plate` og `fuel_card_code`. Naar en bil med samme nummer oprettes i en anden afdeling, fejler det med "duplicate key value violates unique constraint". Constraints skal vaere per afdeling (composite med `department_id`).

**Loesning:**

**SQL migration:**
```sql
-- Drop globale constraints
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS unique_car_number;
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS unique_number_plate;
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS unique_fuel_card_code;

-- Opret composite constraints per afdeling
ALTER TABLE public.cars ADD CONSTRAINT unique_car_number_per_dept 
  UNIQUE (car_number, department_id);
ALTER TABLE public.cars ADD CONSTRAINT unique_number_plate_per_dept 
  UNIQUE (number_plate, department_id);
ALTER TABLE public.cars ADD CONSTRAINT unique_fuel_card_code_per_dept 
  UNIQUE (fuel_card_code, department_id);
```

Derudover skal fejlmeddelelser i `CarSecurityService` oversaettes saa brugeren faar en forstaaelig besked naar der stadig er konflikter inden for samme afdeling.

---

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/components/Dashboard/AssignmentDetailsDialog.tsx` | Flyt medarbejder/bil-sektion op foer beskrivelse i layoutet |
| `src/translations/da/common.ts` | Tilfoej `subDepartment` og `selectSubDepartment` |
| `src/translations/en/common.ts` | Tilfoej `subDepartment` og `selectSubDepartment` |
| Ny SQL migration | AEndr unikke constraints til composite per afdeling |

