

## Fix: Udvid filnavn-sanitering til at haandtere alle ikke-ASCII tegn

### Analyse

Filen "Aftaleseddl ved ikke dækningsberettet skade (udkald).pdf" fejler stadig efter foerste sanitering. Den nuvaerende regex fjerner kun specifikke specialtegn, men **ikke danske bogstaver** som æ, ø, å. Storage-stien indeholder stadig "dækningsberettet" med "æ", som sandsynligvis foraarsager den stille fejl.

Bekraeftet: Alle eksisterende filer i storage har rene ASCII-navne (f.eks. "Formaldehyd.png").

### Loesning

#### 1. `src/hooks/assignment/useAssignmentFiles.ts` — Erstat sanitering med streng ASCII-only tilgang

I stedet for at blockliste specifikke tegn, brug en allowlist-tilgang der kun beholder ASCII-sikre tegn:

```typescript
const sanitizedName = file.name
  .normalize('NFD')                    // Dekomponér æ → ae, ø → o, å → a (via Unicode)
  .replace(/[\u0300-\u036f]/g, '')     // Fjern combining diacritical marks
  .replace(/[^a-zA-Z0-9._-]/g, '_')   // Behold kun alfanumerisk, punktum, bindestreg, underscore
  .replace(/_+/g, '_');                // Kollapser multiple underscores
```

Dette konverterer "Aftaleseddl ved ikke dækningsberettet skade (udkald).pdf" til "Aftaleseddl_ved_ikke_daekningsberettet_skade__udkald_.pdf" — ren ASCII.

#### 2. `CHANGELOG.md` — Dokumenter

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/hooks/assignment/useAssignmentFiles.ts` | Udvid sanitering til ASCII-only med NFD-normalisering |
| `CHANGELOG.md` | Dokumenter fix |

