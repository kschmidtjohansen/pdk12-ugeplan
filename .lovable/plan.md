

## Fase 6: Database-optimering (Runde 2)

### 1. Fjern redundante indexes (13 stk)

Frigoer indeks-plads og reducerer write-overhead uden at paavirke laeseydelse.

| Index | Tabel | Grund til fjernelse |
|-------|-------|---------------------|
| `idx_notifications_user_unread` | notifications | Subset af `idx_notifications_unread` (user_id, created_at WHERE read=false) |
| `notifications_user_id_idx` | notifications | Subset af `idx_notifications_user_read_created` (user_id, read, created_at) |
| `notifications_created_at_idx` | notifications | Sjelden brugt alene, daekket af user_id composites |
| `idx_profiles_id` | profiles | Duplikerer `profiles_pkey` (btree paa id) |
| `idx_profiles_status` | profiles | Subset af `idx_profiles_status_name` og `idx_profiles_status_job_title` |
| `idx_profiles_status_name` | profiles | Duplikeret af `idx_profiles_status_name_optimized` (same cols + WHERE filter) |
| `idx_assignments_published_date` | assignments | Subset af `idx_assignments_combined` (date, published, user, time WHERE published) |
| `idx_assignments_date_range_user` | assignments | Subset af `idx_assignments_combined` (date, published, user WHERE published) |
| `idx_assignments_date_time` | assignments | Subset af `idx_assignments_comprehensive` (date, published, type, user INCLUDE title, location) |
| `idx_logs_created_at` | logs | Subset af `idx_logs_type_created_optimal` (event_type, created_at DESC) |
| `idx_logs_event_type` | logs | Subset af `idx_logs_type_created_optimal` |
| `idx_case_folder_mappings_case_number` | case_folder_mappings | Duplikerer unique constraint `case_folder_mappings_case_number_key` |
| `idx_vacations_status_dates` | vacations | Overlapper med `idx_vacations_date_range_status` (same cols, different order) |

SQL-migration:
```text
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS notifications_user_id_idx;
DROP INDEX IF EXISTS notifications_created_at_idx;
DROP INDEX IF EXISTS idx_profiles_id;
DROP INDEX IF EXISTS idx_profiles_status;
DROP INDEX IF EXISTS idx_profiles_status_name;
DROP INDEX IF EXISTS idx_assignments_published_date;
DROP INDEX IF EXISTS idx_assignments_date_range_user;
DROP INDEX IF EXISTS idx_assignments_date_time;
DROP INDEX IF EXISTS idx_logs_created_at;
DROP INDEX IF EXISTS idx_logs_event_type;
DROP INDEX IF EXISTS idx_case_folder_mappings_case_number;
DROP INDEX IF EXISTS idx_vacations_status_dates;
```

---

### 2. Oprydning af logs-stoej (317k raekker / ~180 MB)

Slet de 3 stoerste stoejkategorier via data-operation (INSERT tool):

```text
DELETE FROM logs WHERE event_type = 'vacation_realtime_change';    -- 229k raekker (62.6%)
DELETE FROM logs WHERE event_type = 'enhanced_error_timeout';      -- 58k raekker (15.8%)
DELETE FROM logs WHERE event_type = 'enhanced_error_database';     -- 30k raekker (8.3%)
```

Forventet besparelse: ~180 MB af 276 MB (65% reduktion).

---

### 3. Dokumentation af redundante kolonner

Folgende kolonner er identificeret som ubrugte/redundante. De fjernes **ikke** (sikkerhedsklausul), men dokumenteres:

| Tabel | Kolonne | Status | Begrundelse |
|-------|---------|--------|-------------|
| `assignments` | `onedrive_folder_id` | 100% NULL | Aldrig taget i brug |
| `assignments` | `route_distance_km` | 100% NULL | Aldrig taget i brug |
| `assignments` | `route_duration_min` | 100% NULL | Aldrig taget i brug |
| `assignments` | `attachment_files` | JSONB, avg 5 bytes (`[]`) | Erstattet af `assignment_files`-tabel |
| `cars` | `sub_department_id` | Legacy | Erstattet af `car_sub_departments` junction |
| `logs` | `message` | btree index paa TEXT | `logs_message_idx` er ineffektiv paa lange tekster |

---

### 4. Fjern ineffektivt logs_message_idx

`logs_message_idx` er et btree-index paa en `TEXT`-kolonne med avg_width 66 og kun 95 distinct vaerdier. Btree paa lange tekstfelter er ineffektivt. Fjernes:

```text
DROP INDEX IF EXISTS logs_message_idx;
```

---

### 5. Fil-upload metadata verifikation

`assignment_files`-tabellen er korrekt normaliseret:
- Gemmer kun `file_path` (URL), `file_name`, `mime_type`, `file_size` og `folder_name`
- Ingen redundant data (billeder gemmes i Supabase Storage, kun reference i DB)
- Eksisterende `cleanup_old_change_logs()` RPC daekker log-oprydning
- `assignments.attachment_files` JSONB er redundant men kan ikke fjernes (sikkerhedsklausul)

---

### Samlet filplan

| Fil | Handling |
|-----|---------|
| **SQL-migration** | Fjern 14 redundante indexes |
| **Data-oprydning** | Slet 317k stoej-raekker fra logs |
| `docs/implementation-plan/tasks.md` | Tilfoej Fase 6 med opgaver markeret [x] |
| `docs/technical-specs/database-schema.md` | Tilfoej sektion om redundante kolonner og fjernede indexes |
| `CHANGELOG.md` | Dokumenter alle optimeriner |

### Hvad der IKKE aendres

- Ingen kolonner omdoebes eller fjernes (sikkerhedsklausul)
- Ingen tabelnavne aendres
- Ingen datatyper aendres (TEXT -> VARCHAR er risikabelt med eksisterende data)
- Frontend-kode paavirkes ikke

