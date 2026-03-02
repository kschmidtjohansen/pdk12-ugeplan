

## Fix: PDF-upload fejler stille — sandsynligvis specialtegn i filnavn

### Analyse

Filen "Aftaleseddl ved ikke dækningsberettet skade (udkald).pdf" er hverken i Supabase Storage eller i `assignment_files`-tabellen. Uploaden fejler altsaa helt, men ingen fejlbesked vises.

Sammenligning af alle eksisterende filer i storage viser at **ingen filer har parenteser i navnet**. Filnavnet indeholder `(udkald)` som sandsynligvis foraarsager en stille fejl i Supabase Storage upload.

### Loesning

#### 1. `src/hooks/assignment/useAssignmentFiles.ts` — Sanitize filnavn i storage-path

Erstat specialtegn (parenteser, #, %, osv.) i filnavnet naar storage-path konstrueres, men bevar det originale filnavn i DB-recorden:

```typescript
// Sanitize filename for storage path (keep original in DB)
const sanitizedName = file.name
  .replace(/[()#%&{}\\<>*?/$!'":@+`|=]/g, '_')
  .replace(/\s+/g, '_');
const filePath = `${assignmentId}/${folderName || 'general'}/${timestamp}-${sanitizedName}`;
```

DB-feltet `file_name` beholder det originale filnavn saa brugeren ser den rigtige fil.

#### 2. Mere synlig fejlhaandtering

Goer error-toasts persistent (laengere varighed) saa brugeren ikke overser dem:

```typescript
toast.error('Upload fejlede: ...', { duration: 8000 });
```

#### 3. Verification efter upload

Tilfoej et simpelt tjek efter DB-insert for at bekraefte at filen faktisk blev gemt, saa vi fanger edge cases:

```typescript
// Verify file was saved
const { count } = await supabase
  .from('assignment_files')
  .select('id', { count: 'exact', head: true })
  .eq('file_path', filePath);

if (!count) {
  toast.error('Filen blev ikke gemt korrekt', { duration: 8000 });
}
```

#### 4. `CHANGELOG.md` — Dokumenter

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/hooks/assignment/useAssignmentFiles.ts` | Sanitize filnavne, persistent fejl-toasts, upload-verifikation |
| `CHANGELOG.md` | Dokumenter fix |

