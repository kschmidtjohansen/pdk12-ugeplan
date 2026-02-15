

## Database-strukturanalyse og optimering

### 1. Audit-resumé

| Kategori | Fund | Handling |
|----------|------|---------|
| Manglende indexes | 8 kolonner | SQL-migration |
| Redundante indexes | 3 på assignments | SQL-migration (fjern) |
| Redundant kolonne | `cars.sub_department_id` | Dokumenteret (kræver schema-ændring) |
| Logs-tabel | 276 MB / 366k rækker | Anbefaling (ingen ændring nu) |
| Hardcoded undertitel | Login + index.html | Kode-ændring |

---

### 2. Manglende indexes (skal tilføjes)

Følgende kolonner bruges hyppigt i WHERE-betingelser og JOINs men mangler indexes:

| Tabel | Kolonne | Begrundelse |
|-------|---------|------------|
| `assignments` | `department_id` | Filtrering per afdeling i planner |
| `assignments` | `sub_department_id` | Filtrering per underafdeling |
| `on_call_duties` | `department_id` | Vagtplan filtreres per afdeling |
| `on_call_duties` | `sub_department_id` | Vagtplan filtreres per underafdeling |
| `vacations` | `department_id` | Ferie filtreres per afdeling |
| `vacations` | `sub_department_id` | Ferie filtreres per underafdeling |
| `warehouse_items` | `department_id` | Lager filtreres per afdeling |
| `warehouse_items` | `sub_department_id` | Lager filtreres per underafdeling |

---

### 3. Redundante indexes (kan fjernes)

`assignments`-tabellen har 12 indexes for kun 1035 rækker. Flere overlapper:

| Index | Erstattet af |
|-------|-------------|
| `idx_assignments_date_published` | `idx_assignments_combined` (dækker `assignment_date, published` + mere) |
| `idx_assignments_responsible_user` | `idx_assignments_responsible_date` (dækker `responsible_user_id` + `assignment_date`) |
| `idx_assignments_responsible_published` | `idx_assignments_date_range_user` (dækker samme filtre med partial index) |

---

### 4. Redundant kolonne (dokumenteres, ændres ikke)

`cars.sub_department_id` er nu erstattet af `car_sub_departments` junction-tabellen. Kolonnen bruges stadig af 1 bil i live-data. Vi fjerner den IKKE nu (brugeren har bedt om at bevare schema), men det dokumenteres som fremtidig oprydning.

---

### 5. Logs-tabel: 276 MB (observation)

| Event type | Rækker | Andel |
|-----------|--------|-------|
| `vacation_realtime_change` | 229.276 | 63% |
| `enhanced_error_timeout` | 58.009 | 16% |
| `enhanced_error_database` | 30.149 | 8% |

229k rækker er `vacation_realtime_change` - dette er støj fra realtime-triggers. Det fylder ca. 170 MB. En oprydning kan reducere tabellen med ~80%, men det kræver DELETE-operationer som brugeren har bedt os om at undgå. Dokumenteres som anbefaling.

---

### 6. Fil-upload metadata (OK)

`assignment_files`-tabellen er effektiv: `file_name`, `file_path`, `mime_type`, `file_size`, `comment`, `folder_name`. Ingen redundans. Filerne selv er i Supabase Storage. Ingen ændring nødvendig.

---

### 7. Hardcoded undertitel ved login

**Problem:** `login.internalSystem` er hardcoded til "Afdeling 12 - Trekantsområdet" i både DA og EN oversættelser. `index.html` meta tags indeholder også "Afdeling 12".

**Løsning:** LoginPage læser `selected_department_id` fra localStorage (som DepartmentContext allerede gemmer) og henter afdelingsnavnet fra Supabase. Hvis ingen afdeling er gemt, vises en generisk tekst ("Internt planlægningssystem").

---

### Konkrete ændringer

| Fil | Ændring |
|-----|---------|
| **SQL-migration** | Tilføj 8 indexes på department_id/sub_department_id. Fjern 3 redundante indexes på assignments |
| `src/translations/da/login.ts` | Ændr `internalSystem` til `'Internt planlægningssystem'` (fallback-tekst) |
| `src/translations/en/login.ts` | Ændr `internalSystem` til `'Internal planning system'` (fallback-tekst) |
| `src/pages/LoginPage.tsx` | Tilføj useEffect der læser `selected_department_id` fra localStorage og henter afdelingsnavn fra `departments`-tabellen. Vis afdelingsnavnet i stedet for den statiske oversættelse |
| `index.html` | Fjern "Afdeling 12 Trekantsområdet" fra meta description og og:description, erstat med "Polygon Ugeplan - Internt planlægningssystem" |
| `CHANGELOG.md` | Tilføj alle ændringer |

### Tekniske detaljer

**SQL-migration:**
```sql
-- Tilføj manglende indexes
CREATE INDEX idx_assignments_department ON assignments(department_id);
CREATE INDEX idx_assignments_sub_department ON assignments(sub_department_id);
CREATE INDEX idx_on_call_duties_department ON on_call_duties(department_id);
CREATE INDEX idx_on_call_duties_sub_department ON on_call_duties(sub_department_id);
CREATE INDEX idx_vacations_department ON vacations(department_id);
CREATE INDEX idx_vacations_sub_department ON vacations(sub_department_id);
CREATE INDEX idx_warehouse_items_department ON warehouse_items(department_id);
CREATE INDEX idx_warehouse_items_sub_department ON warehouse_items(sub_department_id);

-- Fjern redundante indexes
DROP INDEX idx_assignments_date_published;
DROP INDEX idx_assignments_responsible_user;
DROP INDEX idx_assignments_responsible_published;
```

**LoginPage.tsx - dynamisk undertitel:**
```tsx
const [departmentName, setDepartmentName] = useState<string | null>(null);

useEffect(() => {
  const storedDeptId = localStorage.getItem('selected_department_id');
  if (storedDeptId) {
    supabase.from('departments').select('name').eq('id', storedDeptId).single()
      .then(({ data }) => {
        if (data?.name) setDepartmentName(data.name);
      });
  }
}, []);

// I JSX:
<p className="text-gray-600">
  {departmentName || t('login.internalSystem')}
</p>
```

### Anbefalinger (ikke implementeret nu)

1. **Logs-oprydning:** Slet `vacation_realtime_change` og `enhanced_error_*` logs ældre end 30 dage. Potentiel besparelse: ~250 MB
2. **Fjern `cars.sub_department_id`:** Når junction-tabellen er fuldt migreret, kan den gamle kolonne droppes
3. **Partitioner logs-tabellen:** `logs_partitioned` eksisterer men bruges ikke. Overvej at migrere til partitioneret tabel for automatisk oprydning

