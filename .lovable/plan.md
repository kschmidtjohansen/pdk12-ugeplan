

## Fix: Lokationer skal isoleres per afdeling

### Problem
`LocationManagement` bruger en hardcoded liste og gemmer tilpasninger (navne, skjulte lokationer) i `localStorage` med en global noegle (`location-custom-names`). Derfor vises lokationer fra 12 - Fredericia ogsaa i 16 - Asnaes og 02 - Storkoebenhavn.

### Loesning
Scope localStorage-noeglen per `selectedDepartmentId`, saa hver afdeling har sine egne lokationstilpasninger.

---

### Trin 1: Importer DepartmentContext

**`src/components/Admin/LocationManagement.tsx`**

Tilfoej import af `useDepartment` og hent `selectedDepartmentId`.

### Trin 2: Scope localStorage per afdeling

Aendr `STORAGE_KEY` fra en statisk streng til en dynamisk noegle baseret paa `selectedDepartmentId`:

```text
const storageKey = `location-custom-names-${selectedDepartmentId || 'default'}`;
```

Opdater alle steder der bruger `STORAGE_KEY` til at bruge den dynamiske `storageKey`:
- `useEffect` load (linje 32-41)
- `saveToStorage` (linje 43-45)

### Trin 3: Re-load ved afdelingsskift

Tilfoej `selectedDepartmentId` som dependency i load-useEffect, saa tilpasninger genindlaeses naar brugeren skifter afdeling.

### Trin 4: Opdater CHANGELOG.md

---

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/components/Admin/LocationManagement.tsx` | Import useDepartment, scope localStorage per afdeling |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Lokationer i 12 - Fredericia paavirker ikke 16 - Asnaes eller 02 - Storkoebenhavn
- Eksisterende tilpasninger i Fredericia bevares (de ligger under den gamle noegle, men nye gemmes korrekt)
- Sletning af en lokation i en afdeling paavirker ikke andre afdelinger

