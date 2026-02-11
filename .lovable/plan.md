

## Demo-bruger: Usynlig i afdelinger + fuld adgang + midlertidig data

### Overblik

Demo-brugeren (`test@polygongroup.com`) skal:
1. Kunne se og afproeve alle funktioner paa tvaers af alle afdelinger
2. Vaere fuldstaendig usynlig for andre brugere overalt i systemet
3. Al demo-data slettes automatisk efter 15 minutter eller ved tryk paa "Ryd demo data"-knappen (allerede implementeret -- bevares uaendret)

### Nuvaerende status

| Omraade | Demo-bruger skjult? | Demo data midlertidig? |
|---------|---------------------|------------------------|
| Medarbejderliste | Ja (allerede filtreret) | Ja |
| Brugerstyring (Admin) | **Nej** | Ja |
| Opgaver (assignments) | Delvist | Ja (15 min auto-cleanup) |
| Ferier | Delvist | Ja (15 min auto-cleanup) |
| Vagter (duties) | **Nej** | Ja (15 min auto-cleanup) |
| Auto-cleanup system | N/A | Ja (allerede implementeret) |

### Hvad aendres

---

**Fil 1: `src/components/Admin/UserManagement.tsx`**

- I `filteredUsers` useMemo: Filtrer demo-brugeren (`test@polygongroup.com` / `165cdbc9-...`) ud af listen naar den aktuelle bruger IKKE er demo-brugeren
- Demo-brugeren vises hverken under en afdeling eller under "Uden afdeling"

---

**Fil 2: `src/services/enhancedDataFetching.ts`**

- I `fetchEmployees`: Fjern demo-brugerens profil fra resultatet naar `isDemoMode` er `false`
- I `fetchAssignments`: Filtrer opgaver oprettet af eller tildelt demo-brugeren naar `isDemoMode` er `false`
- Naar demo-bruger er logget ind: Send IKKE `p_department_id` til RPC-kald, saa data fra alle afdelinger returneres

---

**Fil 3: `src/hooks/duty/useDutyData.ts`**

- Naar brugeren IKKE er demo-bruger: Filtrer vagter tildelt demo-brugeren ud
- Naar demo-bruger er logget ind: Hent vagter uden afdelingsfilter (alle afdelinger)

---

**Fil 4: `src/hooks/employee/useEmployeeData.ts`**

- Naar `isDemoMode` er true: Spring afdelingsfiltrering over (vis alle medarbejdere fra alle afdelinger)

---

### Hvad aendres IKKE (allerede implementeret)

Den eksisterende auto-cleanup-mekanisme bevares fuldstaendig som den er:

- **15 minutters timer**: `useDemoAutoCleanup.ts` taeller ned og sletter automatisk al demo-data (opgaver, notifikationer, ferier, medarbejder-tilknytninger)
- **Manuel "Ryd demo data"-knap**: I `DemoDashboard.tsx` -- sletter al demo-data med det samme
- **Session-end cleanup**: Data slettes ogsaa naar fanebladet lukkes eller skjules
- **1 minuts advarsel**: Vises foer automatisk sletning
- **Forlaeeng session**: Mulighed for at tilfoeje 15 minutter mere

Alt dette sikrer at demo-data aldrig paavirker live-versionen.

---

### Tekniske detaljer

**Filer der aendres**:

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| `src/components/Admin/UserManagement.tsx` | OPDATER | Filtrer demo-bruger fra brugerlisten |
| `src/services/enhancedDataFetching.ts` | OPDATER | Filtrer demo-data + bypass afdelingsfilter for demo |
| `src/hooks/duty/useDutyData.ts` | OPDATER | Filtrer demo-vagter + bypass afdelingsfilter |
| `src/hooks/employee/useEmployeeData.ts` | OPDATER | Bypass afdelingsfilter for demo-bruger |

**Filtreringslogik**:

```text
For ALLE datahentninger:
  HVIS aktuel bruger ER demo-bruger:
    -> Vis ALLE data fra ALLE afdelinger (ingen afdelingsfilter)
    -> Inkluder demo-brugerens egne data
    -> Data slettes automatisk efter 15 min (eksisterende logik)
  ELLERS (normal bruger):
    -> Anvend afdelingsfilter som normalt
    -> Fjern demo-brugerens data fra resultatet
    -> Demo-data ses aldrig af andre brugere
```

**Ingen databaseaendringer er noedvendige** -- al filtrering sker i frontend, og auto-cleanup er allerede paa plads.

