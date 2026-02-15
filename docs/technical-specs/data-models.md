# Data Models

Komplet oversigt over projektets database-schema baseret på `src/integrations/supabase/types.ts`.

---

## Kernetabeller (17 stk)

### assignments
Opgaver/sager i planlæggeren.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| title | text | Nej | — |
| description | text | Ja | — |
| assignment_date | date | Nej | — |
| from_time | time | Nej | — |
| to_time | time | Nej | — |
| location | text | Nej | — |
| type | assignment_type | Ja | `'other'` |
| published | boolean | Ja | `false` |
| case_number | text | Ja | — |
| car_id | uuid | Ja | — |
| car_ids | uuid[] | Ja | — |
| responsible_user_id | uuid | Ja | — |
| department_id | uuid | Ja | — |
| sub_department_id | uuid | Ja | — |
| attachment_files | jsonb | Ja | `'[]'` |
| onedrive_folder_id | text | Ja | — |
| route_distance_km | numeric | Ja | — |
| route_duration_min | integer | Ja | — |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

**Foreign keys:**
- `department_id` → `departments.id`
- `sub_department_id` → `sub_departments.id`
- `car_id` → `cars.id`
- `responsible_user_id` → `profiles.id`

---

### assignment_files
Filer vedhæftet til opgaver.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| assignment_id | uuid | Nej | — |
| user_id | uuid | Nej | — |
| file_name | text | Nej | — |
| file_path | text | Nej | — |
| file_size | integer | Ja | — |
| mime_type | text | Ja | — |
| folder_name | text | Ja | — |
| comment | text | Ja | — |
| created_at | timestamptz | Nej | `now()` |

**Foreign keys:**
- `assignment_id` → `assignments.id`
- `user_id` → `profiles.id`

---

### assignment_messages
Chat-beskeder på opgaver.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| assignment_id | uuid | Nej | — |
| user_id | uuid | Nej | — |
| message | text | Nej | — |
| reply_to_id | uuid | Ja | — |
| created_at | timestamptz | Nej | `now()` |

**Foreign keys:**
- `assignment_id` → `assignments.id`
- `reply_to_id` → `assignment_messages.id`
- `user_id` → `profiles.id`

---

### cars
Køretøjer tilgængelige for opgaver.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| name | text | Nej | — |
| car_number | text | Nej | — |
| number_plate | text | Nej | — |
| fuel_card_code | text | Nej | — |
| is_available | boolean | Nej | `true` |
| has_trailer_hitch | boolean | Ja | `false` |
| show_in_planner | boolean | Nej | `true` |
| notes | text | Ja | — |
| total_weight | integer | Ja | — |
| towing_capacity_with_brakes | integer | Ja | — |
| towing_capacity_without_brakes | integer | Ja | — |
| department_id | uuid | Ja | — |
| sub_department_id | uuid | Ja | — (redundant, se `car_sub_departments`) |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

**Foreign keys:**
- `department_id` → `departments.id`
- `sub_department_id` → `sub_departments.id`

---

### departments
Afdelinger i organisationen.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| name | text | Nej | — |
| chat_enabled | boolean | Nej | `true` |
| duty_enabled | boolean | Nej | `true` |
| files_enabled | boolean | Nej | `true` |
| warehouse_enabled | boolean | Nej | `true` |
| substitute_enabled | boolean | Nej | `true` |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

---

### sub_departments
Underafdelinger tilknyttet en afdeling.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| name | text | Nej | — |
| department_id | uuid | Nej | — |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

**Foreign keys:**
- `department_id` → `departments.id`

---

### profiles
Brugerprofiler (public schema mirror af auth.users).

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | — (fra auth.users) |
| name | text | Nej | — |
| email | text | Nej | — |
| phone | text | Ja | — |
| job_title | text | Ja | — |
| status | employee_status | Nej | `'active'` |
| on_leave | boolean | Ja | `false` |
| notes | text | Ja | — |
| avatar_url | text | Ja | — |
| is_visible_in_planning | boolean | Nej | `true` |
| is_temporary | boolean | Ja | `false` |
| expires_at | timestamptz | Ja | — |
| home_department_id | uuid | Ja | — |
| has_forklift_license | boolean | Nej | `false` |
| has_drivers_license | boolean | Ja | `false` |
| has_trailer_license | boolean | Ja | `false` |
| has_asbestos_certificate | boolean | Ja | `false` |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

**Foreign keys:**
- `home_department_id` → `departments.id`

---

### user_roles
Brugerroller (én rolle per bruger).

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| user_id | uuid | Nej | — |
| role | user_role | Nej | `'servicemedarbejder'` |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

---

### notifications
Brugernotifikationer.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| user_id | uuid | Nej | — |
| type | text | Nej | — |
| title | text | Nej | — |
| message | text | Nej | — |
| link | text | Ja | — |
| read | boolean | Nej | `false` |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

---

### on_call_duties
Vagtplaner.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| duty_date | date | Nej | — |
| duty_type | duty_type | Nej | — |
| employee_id | uuid | Ja | — |
| created_by | uuid | Nej | — |
| department_id | uuid | Ja | — |
| sub_department_id | uuid | Ja | — |
| notes | text | Ja | — |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

**Foreign keys:**
- `employee_id` → `profiles.id`
- `created_by` → `profiles.id`
- `department_id` → `departments.id`
- `sub_department_id` → `sub_departments.id`

---

### vacations
Ferie- og fraværsanmodninger.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| user_id | uuid | Nej | — |
| start_date | date | Nej | — |
| end_date | date | Nej | — |
| start_time | time | Ja | — |
| end_time | time | Ja | — |
| is_same_day | boolean | Ja | `true` |
| status | vacation_status | Ja | `'pending'` |
| request_type | text | Ja | `'full_day'` |
| reason | text | Ja | — |
| notes | text | Ja | — |
| department_id | uuid | Ja | — |
| sub_department_id | uuid | Ja | — |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

**Foreign keys:**
- `department_id` → `departments.id`
- `sub_department_id` → `sub_departments.id`

---

### warehouse_items
Lagervarer.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| address | text | Nej | — |
| case_number | text | Ja | — |
| is_cleaned | text | Nej | `'nej'` |
| quantity | integer | Nej | `0` |
| hall | text | Ja | — |
| notes | text | Ja | — |
| created_by | uuid | Ja | — |
| department_id | uuid | Ja | — |
| sub_department_id | uuid | Ja | — |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

**Foreign keys:**
- `department_id` → `departments.id`
- `sub_department_id` → `sub_departments.id`

---

### case_folder_mappings
Mapning af sagsnumre til brugerdefinerede mappenavne.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| case_number | text | Nej | — |
| custom_folder_name | text | Nej | — |
| folder_url | text | Ja | — |
| notes | text | Ja | — |
| created_by | uuid | Ja | — |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

---

### case_onedrive_mappings
Mapning af sagsnumre til OneDrive-mapper.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| case_number | text | Nej | — |
| folder_id | text | Nej | — |
| folder_url | text | Nej | — |
| created_by | uuid | Ja | — |
| created_at | timestamptz | Ja | `now()` |
| updated_at | timestamptz | Ja | `now()` |

---

### onedrive_settings
OneDrive-integrations-indstillinger.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| base_sharepoint_url | text | Nej | — |
| main_folder_path | text | Nej | `'/sites/YourSite/...'` |
| folder_naming_pattern | text | Nej | `'{case_number}'` |
| is_active | boolean | Nej | `true` |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

---

### planner_change_log
Ændringslog for planlæggeren.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| assignment_id | uuid | Ja | — |
| changed_by | uuid | Nej | — |
| changed_by_name | text | Nej | — |
| changed_by_first_name | text | Ja | — |
| operation | text | Nej | — |
| change_details | jsonb | Nej | — |
| created_at | timestamptz | Nej | `now()` |

**Foreign keys:**
- `assignment_id` → `assignments.id`
- `changed_by` → `profiles.id`

---

## Junction-tabeller (3 stk)

### assignments_employees
Mange-til-mange: opgaver ↔ medarbejdere.

| Kolonne | Type | Nullable |
|---------|------|----------|
| assignment_id | uuid | Nej |
| user_id | uuid | Nej |

**Foreign keys:**
- `assignment_id` → `assignments.id`
- `user_id` → `profiles.id`

### car_sub_departments
Mange-til-mange: biler ↔ underafdelinger.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| car_id | uuid | Nej | — |
| sub_department_id | uuid | Nej | — |
| created_at | timestamptz | Ja | `now()` |

**Foreign keys:**
- `car_id` → `cars.id`
- `sub_department_id` → `sub_departments.id`

### user_access
Mange-til-mange: brugere ↔ afdelinger (adgangskontrol).

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| user_id | uuid | Nej | — |
| department_id | uuid | Nej | — |
| sub_department_id | uuid | Ja | — |
| created_at | timestamptz | Nej | `now()` |

**Foreign keys:**
- `department_id` → `departments.id`
- `sub_department_id` → `sub_departments.id`

---

## Log-tabeller (4 stk)

### logs
Generel log-tabel.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| event_type | text | Nej | — |
| message | text | Nej | — |
| details | jsonb | Ja | — |
| created_at | timestamptz | Nej | `now()` |

### logs_partitioned
Partitioneret log-tabel med månedlige partitioner.

Samme struktur som `logs`. Partitioner: `logs_y2025m07`, `logs_y2025m08`.

---

## System-tabeller (1 stk)

### system_cleanup_tracking
Sporing af automatiske oprydningsjob.

| Kolonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | Nej | `gen_random_uuid()` |
| cleanup_type | text | Nej | — |
| last_run_date | date | Nej | — |
| created_at | timestamptz | Nej | `now()` |
| updated_at | timestamptz | Nej | `now()` |

---

## Enums (5 stk)

| Enum | Værdier |
|------|---------|
| `assignment_type` | Opgavetyper (f.eks. `'other'`) |
| `duty_type` | Vagttyper |
| `employee_status` | `'active'`, `'inactive'`, `'on_leave'`, `'terminated'` |
| `user_role` | `'super_admin'`, `'administrator'`, `'skadeleder'`, `'servicemedarbejder'`, `'vikar'` |
| `vacation_status` | `'pending'`, `'approved'`, `'rejected'` |

---

## RPC-funktioner (47 stk)

### Adgangskontrol (10)
| Funktion | Beskrivelse |
|----------|-------------|
| `is_admin_or_skadeleder()` | Returnerer `true` hvis bruger er admin/skadeleder |
| `is_super_admin(_user_id?)` | Tjekker super_admin rolle |
| `is_admin_user()` | Tjekker admin rolle |
| `is_current_user_admin()` | Alias for admin-check |
| `can_access_department_data(_dept_id, _sub_dept_id?, _user_id?)` | Afdelingsbaseret adgang |
| `can_access_vacation(vacation_user_id)` | Ferie-adgangskontrol |
| `can_user_access_assignment(assignment_id, user_id)` | Opgave-adgang |
| `can_view_assignment_optimized(assignment_id, user_id)` | Optimeret opgave-visning |
| `can_access_assignment(assignment_id)` | Simpel opgave-adgang |
| `can_view_fuel_codes()` | Brændstofkort-adgang |

### Data-hentning (15)
| Funktion | Beskrivelse |
|----------|-------------|
| `get_current_user_role()` | Henter aktuel brugers rolle |
| `get_user_role(uid)` | Henter rolle for specifik bruger |
| `get_user_role_safe(user_uuid)` | Sikker rolle-hentning |
| `get_profile_with_role(profile_id)` | Profil med rolle |
| `get_profile_detailed(profile_user_id)` | Detaljeret profil |
| `get_profiles_basic()` | Basale profiler |
| `get_profiles_admin_detailed(full_access?, access_reason?)` | Admin profilvisning |
| `get_accessible_profiles()` | Tilgængelige profiler |
| `get_cars_with_security()` | Biler med sikkerhedsfilter |
| `get_user_department_ids(_user_id?)` | Brugers afdelings-ID'er |
| `get_user_sub_department_ids(_user_id?)` | Brugers underafdelings-ID'er |
| `list_accessible_assignments_with_team(p_department_id?, p_sub_department_id?)` | Opgaver med team-data |
| `get_security_events_summary()` | Sikkerhedshændelser |
| `get_enhanced_system_metrics()` | System-metrics |
| `user_has_role(check_role)` | Rolle-check |

### Demo-funktioner (6)
| Funktion | Beskrivelse |
|----------|-------------|
| `get_demo_cars_with_security()` | Demo-biler |
| `get_demo_duties_with_employee(start_date?, end_date?)` | Demo-vagter |
| `get_demo_profiles_admin_detailed(full_access?)` | Demo-profiler |
| `get_demo_vacations()` | Demo-ferier |
| `get_demo_warehouse_items()` | Demo-lagervarer |
| `list_demo_assignments_with_team()` | Demo-opgaver |

### Logging (8)
| Funktion | Beskrivelse |
|----------|-------------|
| `log_security_event(event_type, event_message, event_details?)` | Log sikkerhedshændelse |
| `log_security_event_safe(event_type, event_message, event_details?, severity?)` | Sikker logging |
| `log_security_event_optimized(...)` | Optimeret logging |
| `log_data_access_attempt(access_type, table_name, record_id?, success?)` | Log dataadgang |
| `log_profile_access_attempt(access_type, profile_id)` | Log profiladgang |
| `log_realtime_change_throttled(table_name, record_id, operation)` | Throttled realtime-log |
| `log_data_fetch_error_safe(...)` | Log fetch-fejl |
| `log_vacation_security_event(event_type, vacation_id, details?)` | Log ferie-sikkerhed |

### Validering (6)
| Funktion | Beskrivelse |
|----------|-------------|
| `sanitize_text_input(input_text, max_length?)` | Sanitér tekst-input |
| `is_valid_email(email)` | Validér e-mail |
| `is_strong_password(password)` | Validér password-styrke |
| `check_rate_limit_security(operation_key, max_attempts?, window_minutes?)` | Rate limiting |
| `hmac_sha256(key, data)` | HMAC SHA256 hash |
| `validate_data_integrity()` | Validér data-integritet |

### Vedligeholdelse (8)
| Funktion | Beskrivelse |
|----------|-------------|
| `cleanup_expired_temporary_users()` | Slet udløbne vikarer |
| `cleanup_old_change_logs()` | Opryd gamle ændringslogge |
| `delete_expired_approved_vacations()` | Slet udløbne ferier |
| `delete_old_rejected_vacations()` | Slet afviste ferier |
| `perform_database_maintenance()` | Database-vedligeholdelse |
| `run_automated_maintenance()` | Automatisk vedligeholdelse |
| `emergency_log_cleanup()` | Nødoprydning af logs |
| `create_logs_partition_for_month()` | Opret log-partition |

### Øvrige (4)
| Funktion | Beskrivelse |
|----------|-------------|
| `add_system_log(p_event_type, p_message, p_details?)` | Tilføj systemlog |
| `check_system_health()` | System-sundhedscheck |
| `generate_database_summary()` | Database-oversigt |
| `mask_email(p_email)` / `mask_phone(p_phone)` | Maskering af persondata |
