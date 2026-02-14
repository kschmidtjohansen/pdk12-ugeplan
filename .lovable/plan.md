

## Plan: 3 rettelser

### 1. Super admin kan ikke vaelges til fri i ferie-dialogen

**Problem:** I `AdminVacationFormDialog.tsx` (linje 101-102) filtrerer koden med `emp.id !== user?.id`, hvilket udelukker den bruger der er logget ind. Det er korrekt adfaerd - en admin skal ikke kunne vaelge sig selv (de kan bruge den normale ansoegning). 

Det reelle problem er at Kasper fremgaar af listen men IKKE kan vaelges. Dette skyldes sandsynligvis at `selectedEmployeeId` allerede er sat til en anden vaerdi naar dialogen aabnes, og Select-komponenten ikke opdaterer korrekt. Men brugeren siger "kan ikke vaelge Kasper selvom han fremgaar af listen" - dette tyder paa at Select-komponenten muligvis har et problem med at acceptere vaelgningen. 

**Undersoegelse:** Der er ingen logik der specifikt blokerer super_admin roller. Problemet kan vaere at `selectedEmployeeId` bliver sat automatisk til den foerste medarbejder i listen (linje 105-107), og naar brugeren klikker paa en anden, bliver den nulstillet pga. useEffect-loopen. useEffect har `selectedEmployeeId` i dependency-arrayet, saa naar den saettes, koerer useEffect igen og kan potentielt nulstille den.

**Loesning:** Fjern `selectedEmployeeId` fra useEffect dependency array og flyt auto-select logikken til kun at koere naar dialogen aabnes (naar `open` skifter til true). Dette forhindrer at brugerens valg bliver overskrevet.

**Fil:** `src/components/Vacation/AdminVacationFormDialog.tsx`
- Fjern `selectedEmployeeId` og `setSelectedEmployeeId` fra useEffect dependency array
- Tilfoej `open` som dependency saa auto-select kun sker ved aabning

---

### 2. PENDING_ADMIN_APPROVAL vises stadig i braendstofkortkode

**Problem:** Vaerdien `PENDING_ADMIN_APPROVAL` er gemt i databasen (bekraeftet via query, car id: `77f3c43b-aefa-48c3-8c97-15c1b45d1067`). Derudover inkluderer `can_view_fuel_codes()` funktionen i databasen IKKE `super_admin` rollen - den tjekker kun for `administrator` og `skadeleder`. Saa naar en super_admin opretter en bil, returnerer RPC'en `false`, og den gamle kode gemte "PENDING_ADMIN_APPROVAL" som vaerdi.

**Loesning (2 dele):**
1. **SQL migration:** Opdater `can_view_fuel_codes()` funktionen til ogsaa at inkludere `super_admin` rollen
2. **SQL migration:** Opdater den eksisterende record der har `PENDING_ADMIN_APPROVAL` med den korrekte vaerdi (eller en tom streng, da den rigtige kode skal indtastes manuelt af admin)

**Filer:**
| Fil | AEndring |
|-----|---------|
| Ny SQL migration | Opdater `can_view_fuel_codes()` til at inkludere `super_admin` |
| Ny SQL migration | Ryd op i `PENDING_ADMIN_APPROVAL` vaerdier i databasen |

---

### 3. Biler skal kunne tilknyttes flere underafdelinger

**Problem:** `cars` tabellen har en enkelt `sub_department_id` kolonne (uuid). For at tillade at en bil tilhoerer flere underafdelinger kraeves en many-to-many relation.

**Loesning:**
1. **SQL migration:** Opret en ny junction-tabel `car_sub_departments` med `car_id` og `sub_department_id`. Migrer eksisterende `sub_department_id` data fra `cars` til den nye tabel. Behold `sub_department_id` paa `cars` midlertidigt for bagudkompatibilitet.
2. **CarFormDialog:** Erstat den nuvaerende Select med checkboxes (ligesom bruger-afdelinger), saa man kan vaelge flere underafdelinger.
3. **CarSecurityService.fetchCars:** Naar der filtreres paa underafdeling, join med `car_sub_departments` i stedet for at filtrere paa `cars.sub_department_id`.
4. **useCarData:** Opdater query til at joinen med `car_sub_departments`.

**Filer:**
| Fil | AEndring |
|-----|---------|
| Ny SQL migration | Opret `car_sub_departments` tabel, migrer data, tilfoej RLS |
| `src/components/Cars/CarFormDialog.tsx` | Erstat Select med checkboxes for multi-select af underafdelinger |
| `src/services/carSecurityService.ts` | Opdater fetchCars til at joinen med `car_sub_departments` |
| `src/hooks/car/useCarData.ts` | Opdater query til at haandtere mange-til-mange relation |
| `src/hooks/car/useCarFormState.ts` | Tilfoej `sub_department_ids: string[]` til formData |
| `src/components/Cars/types.ts` | Tilfoej `sub_department_ids?: string[]` til CarData |

---

### Tekniske detaljer

#### Fix 1 - AdminVacationFormDialog useEffect:
```tsx
useEffect(() => {
  if (!employees || !open) return;
  
  if (selectedSubDepartmentId) {
    supabase.from('user_access')
      .select('user_id')
      .eq('department_id', selectedDepartmentId)
      .eq('sub_department_id', selectedSubDepartmentId)
      .then(({ data }) => {
        const subDeptUserIds = new Set((data || []).map(a => a.user_id));
        const filtered = employees.filter(emp => 
          subDeptUserIds.has(emp.id) && emp.id !== user?.id
        );
        setAvailableEmployees(filtered);
        if (filtered.length > 0 && !filtered.find(e => e.id === selectedEmployeeId)) {
          setSelectedEmployeeId(filtered[0].id);
        }
      });
  } else {
    const filtered = employees.filter(emp => emp.id !== user?.id);
    setAvailableEmployees(filtered);
    if (filtered.length > 0 && !filtered.find(e => e.id === selectedEmployeeId)) {
      setSelectedEmployeeId(filtered[0].id);
    }
  }
}, [employees, user?.id, selectedSubDepartmentId, selectedDepartmentId, open]);
```

#### Fix 2 - SQL migration:
```sql
-- Fix can_view_fuel_codes to include super_admin
CREATE OR REPLACE FUNCTION public.can_view_fuel_codes()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'administrator', 'skadeleder')
  );
$$;

-- Clean up PENDING_ADMIN_APPROVAL values
UPDATE public.cars 
SET fuel_card_code = '' 
WHERE fuel_card_code = 'PENDING_ADMIN_APPROVAL';
```

#### Fix 3 - car_sub_departments tabel:
```sql
CREATE TABLE public.car_sub_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  sub_department_id uuid NOT NULL REFERENCES public.sub_departments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(car_id, sub_department_id)
);

ALTER TABLE public.car_sub_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view car_sub_departments"
  ON public.car_sub_departments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage car_sub_departments"
  ON public.car_sub_departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'administrator')
    )
  );

-- Migrate existing data
INSERT INTO public.car_sub_departments (car_id, sub_department_id)
SELECT id, sub_department_id FROM public.cars 
WHERE sub_department_id IS NOT NULL;
```

#### CarFormDialog - multi-select checkboxes:
Erstat den nuvaerende `Select` komponent med en liste af checkboxes for hver underafdeling. Ved gem, indsaet/slet raekker i `car_sub_departments`.

#### CarSecurityService.fetchCars - join:
Naar `subDepartmentId` er angivet, filtrer via:
```ts
query = query.in('id', 
  supabase.from('car_sub_departments')
    .select('car_id')
    .eq('sub_department_id', subDepartmentId)
);
```
Alternativt brug en RPC-funktion til at haandtere join.

### Samlet filliste

| Fil | AEndring |
|-----|---------|
| `src/components/Vacation/AdminVacationFormDialog.tsx` | Fix useEffect dependency for at undgaa nulstilling af valg |
| Ny SQL migration | Fix `can_view_fuel_codes()`, ryd PENDING_ADMIN_APPROVAL, opret `car_sub_departments` |
| `src/components/Cars/CarFormDialog.tsx` | Multi-select checkboxes for underafdelinger |
| `src/services/carSecurityService.ts` | Opdater fetchCars til at filtrere via `car_sub_departments` |
| `src/hooks/car/useCarData.ts` | Haandter mange-til-mange relation i queries |
| `src/hooks/car/useCarFormState.ts` | Tilfoej `sub_department_ids` array til formData og handleSubmit |
| `src/components/Cars/types.ts` | Tilfoej `sub_department_ids` til CarData interface |

