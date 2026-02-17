

## Fix: Usynlige biler og sikring af afdelingsarv

### Rodaarsag (bekraeftet via database-undersoegelse)

Foelgende biler i Afdeling 14 (Asnaes, ID: `63d46993-31cb-4921-bb3d-5934984ab6b3`) har `department_id = NULL` i databasen, og bliver derfor filtreret fra af `query.eq('department_id', departmentId)`:

| Bil | car_number | department_id | Problem |
|-----|-----------|---------------|---------|
| Bil 8 - Fugt Dennis | 08 | NULL | Mangler |
| BIL 9 - Fugt Benjamin | 09 | NULL | Mangler |
| Vagtbil 2 | 02 | NULL | Mangler |
| Bil 3 - Stor Tom | 03 | NULL | Mangler |
| Test | 01 | NULL | Mangler (har sub_department_id men ingen department_id) |

Derudover har Afdeling 14 ingen underafdelinger, saa sub-department-filteret er ikke relevant her.

### Aendringer

#### 1. Database: Ret de 5 biler med manglende department_id

Koer en SQL-migration der saetter `department_id` for de biler der hoerer til Afdeling 14 men har NULL:

```sql
UPDATE cars SET department_id = '63d46993-31cb-4921-bb3d-5934984ab6b3'
WHERE id IN (
  'af0bc02f-2f43-4f54-9b01-64348c646e15',  -- Bil 8
  '9adb8769-de49-4ff4-adf7-5edd4974b543',  -- Bil 9
  'af2dab8d-5edd-4d71-8947-0fd59d14121a',  -- Vagtbil 2
  '5a73861a-7945-4428-bd34-61ffa622e3c0',  -- Bil 3
  '77f3c43b-aefa-48c3-8c97-15c1b45d1067'   -- Test
);
```

#### 2. Kode: Forbedret under-afdelingsfiltrering i `CarSecurityService.fetchCars`

Det nuvaerende design returnerer en tom liste hvis `subDepartmentId` er sat men ingen biler er i `car_sub_departments`-tabellen. Det er forkert -- en bruger der ser en underafdeling skal se biler tilknyttet den underafdeling PLUS biler der kun er tilknyttet hovedafdelingen (uden specifik underafdeling).

**Fil: `src/services/carSecurityService.ts` (linje 15-27)**

Aendr logikken fra "vis KUN biler i junction-tabellen" til "vis biler i junction-tabellen ELLER biler uden nogen underafdeling":

```typescript
if (!isDemoMode && subDepartmentId) {
  const { data: carSubDepts } = await supabase
    .from('car_sub_departments')
    .select('car_id')
    .eq('sub_department_id', subDepartmentId);

  const carIds = (carSubDepts || []).map(r => (r as any).car_id);

  // Vis biler tilknyttet underafdelingen + biler uden nogen underafdeling
  if (carIds.length > 0) {
    query = query.or(`id.in.(${carIds.join(',')}),sub_department_id.is.null`);
  }
  // Hvis ingen biler er specifikt tilknyttet, vis alle i hovedafdelingen
  // (allerede filtreret ovenfor via department_id)
}
```

#### 3. Kode: Sikr afdelingsarv ved bil-oprettelse i `CarSecurityService.createCar`

**Fil: `src/services/carSecurityService.ts` (linje 80)**

`department_id` saettes allerede fra `carData.department_id`, og `useCarData.createCar` (linje 138-139) berieger med `selectedDepartmentId`. Dette er korrekt.

Men `CarSecurityService.createCar` bruger `(carData as any).department_id || null` med `|| null`, som konverterer en tom string til null. Det er OK saa laenge `selectedDepartmentId` aldrig er en tom string (det er det ikke -- det er enten en UUID eller null).

Ingen aendring noedvendig her.

#### 4. `CHANGELOG.md`

Dokumenter databaserettelsen og den forbedrede under-afdelingsfiltrering.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| Database (migration) | Saet department_id paa 5 biler |
| `src/services/carSecurityService.ts` | Ret sub-department filter til hierarkisk logik |
| `CHANGELOG.md` | Dokumenter rettelserne |

### Kvalitetstjek
- Michael i Afdeling 14 ser alle 5 biler der foer var usynlige
- Oprettelse af nye biler arver automatisk department_id fra valgt afdeling
- Under-afdelingsfiltrering viser ogsaa biler uden specifik underafdeling
- Afdeling 12 paavirkes ikke (deres biler har allerede korrekt department_id)
