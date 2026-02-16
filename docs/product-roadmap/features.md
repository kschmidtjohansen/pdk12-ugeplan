# Feature-oversigt

## Nuværende features (Implementeret)

### Multi-afdeling & underafdelinger
- Afdelinger (`departments`) med underafdelinger (`sub_departments`)
- `user_access` junction-tabel: bruger ↔ afdeling/underafdeling
- RLS-isolation via `can_access_department_data()` — brugere ser kun data fra egne afdelinger
- Admin-panel til oprettelse og redigering af afdelinger og underafdelinger

### Planlægger (Assignments)
- Opgaveoprettelse med titel, beskrivelse, lokation, tidsrum og sagsnummer
- Tildeling af medarbejdere (mange-til-mange via `assignments_employees`)
- Tildeling af biler (enkelt eller multiple via `car_ids`)
- Ansvarlig bruger (`responsible_user_id`)
- 3 visningstyper: Standard (kort), Kompakt (tabel), Gitter (grid)
- Autopublicering baseret på dato
- Ændringslog (`planner_change_log`) med fuld audit trail

### Chat (Assignment Messages)
- Beskeder knyttet til opgaver (`assignment_messages`)
- Svar-tråde via `reply_to_id`
- Super Admin kan slette andres beskeder

### Fil-upload (Assignment Files)
- Filer knyttet til opgaver (`assignment_files`)
- 20MB filstørrelses-validering
- MIME-type validering
- Metadata: filnavn, filstørrelse, mappe-navn, kommentar

### Vagtplan (On-call Duties)
- Daglige vagter med vagttype (`duty_type` enum)
- Kalender- og listevisning
- Vagtbytter via `swap-duties` edge function
- Påmindelser via `send-duty-reminders` edge function

### Køretøjsstyring (Cars)
- Bilregistrering med nummer, nummerplade, brændstofkort
- Trækkrog-data: kapacitet med/uden bremser, totalvægt
- Multiple underafdelinger via `car_sub_departments` junction
- Brændstofkortkode synlig for Super Admin, Administrator, Skadeleder
- Tilgængeligheds-toggle

### Ferie & Fravær (Vacations)
- Ferieanmodning med start/slut-dato, tidsrum, årsag
- Godkendelsesflow: `pending` → `approved` / `rejected`
- Samme-dags fravær med start/slut-tidspunkt
- Administrator godkender/afviser
- Automatisk oprydning af udløbne/afviste anmodninger

### Lagerstyring (Warehouse)
- Lagervarer med adresse, sagsnummer, hal, antal, rengøringsstatus
- Afdelingsfiltrering via `department_id` / `sub_department_id`

### Demo Mode
- Fuld CRUD i demo-tilstand med isoleret data
- Automatisk oprydning hver 15. minut
- Rolleskift (Super Admin kan simulere andre roller)
- Baseline-data bevares

### Notifikationer
- Real-time notifikationer via Supabase Realtime
- Notifikationstyper: ferie, vagt, opgave
- Markér som læst/ulæst

### Geografisk Optimering
- "Sagens postnummer"-felt i booking-formularen
- Automatisk sortering af medarbejdere efter nærhed til opgaven
- 3 niveauer: Direkte match (samme postnr.), Regional (første 2 cifre), Øvrige
- MapPin-ikon og grønne badges markerer nærliggende medarbejdere
- Ren frontend-logik, kører i realtid mens man taster

---



## Kommende features (Planlagt)

### OneDrive/SharePoint-integration
- Automatisk mappe-oprettelse ved sagsnummer
- `case_onedrive_mappings` og `onedrive_settings` tabeller er forberedt
- Link til SharePoint-mappe direkte fra opgavedetaljer

### PDF-eksport
- Eksport af ugeplaner som PDF
- `pdf-lib` er allerede installeret
- Målformat: A4, én side per dag med alle opgaver og medarbejdere

### Push-notifikationer
- Browser push-notifikationer for nye opgaver og vagtændringer
- Service Worker-baseret
- Opt-in per bruger

### Avanceret rapportering
- Dashboard med grafer over opgavefordeling, fravær og bilbrug
- Eksport til CSV/Excel
- Filtrering per afdeling, underafdeling og tidsperiode

### Automatisk vagtfordeling
- Forslag til vagtplan baseret på historik og tilgængelighed
- Respekterer ferie og fravær
- Manuel godkendelse inden publicering
