

## Fix: Streng afdelingsfiltrering paa biler

### Problem
Den forrige rettelse aendrede filteret til at inkludere biler med `department_id IS NULL` (foraeeldreloese biler). Det medforer at biler uden afdelingstilknytning vises i ALLE afdelinger. Der er pt. 5 biler med `department_id = NULL` som vises overalt.

### Loesning
Aendr filteret tilbage til streng afdelingsfiltrering: Kun biler der eksplicit tilhoerer den valgte afdeling vises.

### Aendringer

**`src/services/carSecurityService.ts`** (linje 12-13)

Erstat:
```text
query = query.or(`department_id.eq.${departmentId},department_id.is.null`);
```

Med:
```text
query = query.eq('department_id', departmentId);
```

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/services/carSecurityService.ts` | Streng afdelingsfiltrering uden NULL-inkludering |
| `CHANGELOG.md` | Dokumenter rettelsen |

### Kvalitetstjek
- Biler vises kun i den afdeling de tilhoerer
- Biler med `department_id = NULL` vises ikke (de boer tildeles en afdeling via admin)
- Underafdelingsfiltrering fungerer fortsat via `car_sub_departments` junction table

