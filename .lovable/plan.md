

## Tre rettelser: Mobil medarbejdervisning, oversaettelser og Super Admin demo-funktion

### 1. Mobil medarbejdervisning - Card-baseret layout (som Biler)

**Fil: `src/components/Employees/MobileEmployeeCard.tsx`** (NY)
- Opret en ny komponent inspireret af `MobileCarCard.tsx` og `MobileWarehouseCard.tsx`
- Vis medarbejderens avatar, navn, kontaktinfo, certifikater, rolle og status i et Card-layout
- Action-knapper (rediger, syg/rask, slet) vises i bunden af kortet - kun for admin

**Fil: `src/components/Employees/EmployeesTable.tsx`** (OPDATER)
- Tilfoej `useIsMobile()` hook
- Paa mobil: vis `MobileEmployeeCard` for hver medarbejder i stedet for tabellen
- Paa desktop: behold den eksisterende tabelvisning
- Samme moenster som `CarsList.tsx` bruger (`md:hidden` / `hidden md:block`)

### 2. Super Admin virker ikke i demo mode

**Fil: `src/context/AuthContext.tsx`** (OPDATER)
- Linje 611: Tilfoej `'super_admin'` til listen af gyldige demo-roller:
  ```
  if (savedDemoRole && ['super_admin', 'administrator', 'skadeleder', 'servicemedarbejder'].includes(savedDemoRole))
  ```
- Uden dette ignoreres `super_admin` naar den hentes fra sessionStorage, og rollen falder tilbage til `administrator`

### 3. Oversaettelser - gennemgang og rettelser

Rolleskift-oversaettelserne i `DemoRoleSwitcher` bruger `t('admin.roles.superAdmin')` (camelCase) men oversaettelsesfilerne har `super_admin` (snake_case). Dog ser det ud til at vaere korrekt baseret paa koden. Lad mig verificere:

- `admin.roles.superAdmin` -> findes IKKE i oversaettelserne (de bruger `super_admin`)
- Rettelse: AEndr `DemoRoleSwitcher.tsx` til at bruge `t('admin.roles.super_admin')` osv.

**Fil: `src/components/Demo/DemoRoleSwitcher.tsx`** (OPDATER)
- Ret oversaettelsesnoegerne fra camelCase til snake_case for at matche oversaettelsesfilerne:
  - `admin.roles.superAdmin` -> `admin.roles.super_admin`
  - `admin.roles.superAdminDesc` -> `admin.roles.super_adminDesc`
  - `admin.roles.administrator` forbliver (matcher allerede)
  - `admin.roles.administratorDesc` forbliver (matcher allerede)
  - `admin.roles.skadeleder` forbliver (matcher allerede)
  - `admin.roles.skadelederDesc` forbliver (matcher allerede)
  - `admin.roles.servicemedarbejder` forbliver (matcher allerede)
  - `admin.roles.servicemedarbejderDesc` forbliver (matcher allerede)

---

### Tekniske detaljer

| Fil | Type | Beskrivelse |
|-----|------|-------------|
| `src/components/Employees/MobileEmployeeCard.tsx` | NY | Card-komponent til mobil medarbejdervisning |
| `src/components/Employees/EmployeesTable.tsx` | OPDATER | Skift til cards paa mobil med `useIsMobile()` |
| `src/context/AuthContext.tsx` | OPDATER | Tilfoej `super_admin` til gyldige demo-roller (linje 611) |
| `src/components/Demo/DemoRoleSwitcher.tsx` | OPDATER | Ret oversaettelsesnoegler fra camelCase til snake_case |

