# Database-skema og relationer

## Afdelingsstruktur

```
departments (1)
  └── sub_departments (N)
        ├── user_access (N) ← bruger ↔ afdeling/underafdeling
        ├── car_sub_departments (N) ← bil ↔ underafdeling
        ├── assignments (N) ← opgaver filtreret per afdeling
        ├── on_call_duties (N) ← vagter per afdeling
        ├── vacations (N) ← ferie per afdeling
        └── warehouse_items (N) ← lager per afdeling
```

---

## Kernerelationer

### Bruger → Afdeling (`user_access`)

Junction-tabel der forbinder brugere med afdelinger og underafdelinger.

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `user_id` | UUID | FK → `profiles.id` (implicit via auth.users) |
| `department_id` | UUID | FK → `departments.id` |
| `sub_department_id` | UUID? | FK → `sub_departments.id` (valgfri) |

**RLS**: Brugere kan se egne tildelinger. Admins kan se alle i deres afdeling.

### Bil → Underafdeling (`car_sub_departments`)

Junction-tabel der tillader biler at tilhøre flere underafdelinger.

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `car_id` | UUID | FK → `cars.id` |
| `sub_department_id` | UUID | FK → `sub_departments.id` |

**Bemærk**: `cars.sub_department_id` eksisterer stadig som legacy-kolonne, men `car_sub_departments` er den autoritative kilde.

### Opgave → Medarbejdere (`assignments_employees`)

Mange-til-mange relation mellem opgaver og medarbejdere.

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `assignment_id` | UUID | FK → `assignments.id` |
| `user_id` | UUID | FK → `profiles.id` |

---

## Afdelingsfiltrering (RLS)

Alle afdelingsspecifikke tabeller filtreres via `can_access_department_data(_dept_id, _sub_dept_id)`:

```sql
-- Forenklet logik
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_access
    WHERE user_id = auth.uid()
      AND department_id = _dept_id
      AND (sub_department_id = _sub_dept_id OR _sub_dept_id IS NULL)
  )
  OR is_super_admin();
$$
```

### Tabeller med afdelingsfiltrering

| Tabel | `department_id` | `sub_department_id` |
|-------|:-:|:-:|
| `assignments` | ✅ | ✅ |
| `on_call_duties` | ✅ | ✅ |
| `vacations` | ✅ | ✅ |
| `warehouse_items` | ✅ | ✅ |
| `cars` | ✅ | Via junction |

---

## Feature toggles per afdeling

`departments`-tabellen har boolean-kolonner der styrer tilgængelige funktioner:

| Kolonne | Standard | Beskrivelse |
|---------|----------|-------------|
| `chat_enabled` | `true` | Chat-beskeder på opgaver |
| `files_enabled` | `true` | Fil-upload på opgaver |
| `duty_enabled` | `true` | Vagtplan-modul |
| `substitute_enabled` | `true` | Vikar-funktionalitet |
| `warehouse_enabled` | `true` | Lager-modul |

---

## Indexes

### Oprettede indexes (Fase 2)

| Tabel | Kolonne(r) | Formål |
|-------|-----------|--------|
| `assignments` | `department_id` | Afdelingsfiltrering |
| `assignments` | `sub_department_id` | Underafdelingsfiltrering |
| `on_call_duties` | `department_id` | Vagtfiltrering |
| `on_call_duties` | `sub_department_id` | Vagtfiltrering |
| `vacations` | `department_id` | Feriefiltrering |
| `vacations` | `sub_department_id` | Feriefiltrering |
| `warehouse_items` | `department_id` | Lagerfiltrering |
| `warehouse_items` | `sub_department_id` | Lagerfiltrering |

### Eksisterende composite indexes

| Tabel | Kolonner | Formål |
|-------|---------|--------|
| `assignments` | `assignment_date, published` | Planlægger-visning |
| `on_call_duties` | `duty_date, employee_id` | Vagtopslag |

### Fjernede redundante indexes (Fase 6)

Følgende 14 indexes blev fjernet 2026-02-15 da de var subsets af eksisterende composite indexes, duplikerede primary keys eller var ineffektive:

| Index | Tabel | Grund |
|-------|-------|-------|
| `idx_notifications_user_unread` | notifications | Subset af `idx_notifications_unread` |
| `notifications_user_id_idx` | notifications | Subset af `idx_notifications_user_read_created` |
| `notifications_created_at_idx` | notifications | Dækket af user_id composites |
| `idx_profiles_id` | profiles | Duplikerer `profiles_pkey` |
| `idx_profiles_status` | profiles | Subset af `idx_profiles_status_name_optimized` |
| `idx_profiles_status_name` | profiles | Duplikeret af `idx_profiles_status_name_optimized` |
| `idx_assignments_published_date` | assignments | Subset af `idx_assignments_combined` |
| `idx_assignments_date_range_user` | assignments | Subset af `idx_assignments_combined` |
| `idx_assignments_date_time` | assignments | Subset af `idx_assignments_comprehensive` |
| `idx_logs_created_at` | logs | Subset af `idx_logs_type_created_optimal` |
| `idx_logs_event_type` | logs | Subset af `idx_logs_type_created_optimal` |
| `idx_case_folder_mappings_case_number` | case_folder_mappings | Duplikerer unique constraint |
| `idx_vacations_status_dates` | vacations | Overlapper med `idx_vacations_date_range_status` |
| `logs_message_idx` | logs | Ineffektivt btree på TEXT-kolonne |

---

## Redundante kolonner (dokumenteret Fase 6)

Følgende kolonner er identificeret som ubrugte/redundante men fjernes **ikke** (sikkerhedsklausul):

| Tabel | Kolonne | Status | Begrundelse |
|-------|---------|--------|-------------|
| `assignments` | `onedrive_folder_id` | 100% NULL | Aldrig taget i brug |
| `assignments` | `route_distance_km` | 100% NULL | Aldrig taget i brug |
| `assignments` | `route_duration_min` | 100% NULL | Aldrig taget i brug |
| `assignments` | `attachment_files` | JSONB, avg 5 bytes | Erstattet af `assignment_files`-tabel |
| `cars` | `sub_department_id` | Legacy | Erstattet af `car_sub_departments` junction |

---

## Backup-rutiner

### Automatisk (Supabase)

- **Point-in-time recovery**: Op til 7 dages historik
- **Daglige snapshots**: Automatisk via Supabase Pro-plan
- **WAL-arkivering**: Kontinuerlig til cloud storage

### Anbefalet custom backup

- **Frekvens**: 2× dagligt (morgen + aften)
- **Metode**: `pg_dump` via Supabase CLI eller cron job
- **Opbevaring**: Ekstern storage (S3/Azure Blob) med 30 dages retention
- **Verifikation**: Månedlig restore-test til staging-miljø

---

## Geografisk grundlag (Fase 5)

### `profiles.home_postcode`

| Kolonne | Type | Nullable | Constraint |
|---------|------|----------|------------|
| `home_postcode` | TEXT | Ja | CHECK `~ '^\d{4}$'` (dansk 4-cifret format) |

### `profiles.home_address`

| Kolonne | Type | Nullable | Constraint |
|---------|------|----------|------------|
| `home_address` | TEXT | Ja | Ingen |

- Begge kun synlige og redigerbare for admin-brugere i UI
- RLS dækkes af eksisterende `profiles`-politikker
- Ingen index nødvendigt (bruges ikke til filtrering endnu)

---

## Log-tabeller

### Struktur

Alle log-tabeller deler samme skema:

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `id` | UUID | Primærnøgle |
| `event_type` | TEXT | Hændelsestype (f.eks. `security_event`, `data_access`) |
| `message` | TEXT | Hændelsesbesked |
| `details` | JSONB? | Yderligere detaljer |
| `created_at` | TIMESTAMPTZ | Oprettelsestidspunkt |

### Partitionering

- `logs_partitioned` → partitioneret efter måned
- `logs_y2025m07`, `logs_y2025m08` → månedlige partitioner
- Nye partitioner oprettes automatisk via `create_logs_partition_for_month()`

### Oprydning

- `cleanup_old_change_logs()` — fjerner gamle ændringslog-poster
- `emergency_log_cleanup()` — nødoprydning ved kritisk lagerforbrug
- Anbefaling: Fjern logs ældre end 30 dage (dokumenteret i Fase 2)
- **Fase 6**: Slettet 317k støj-rækker (vacation_realtime_change, enhanced_error_timeout, enhanced_error_database) — ~180 MB frigjort
