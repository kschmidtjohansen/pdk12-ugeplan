

## Fix: Filuploads (PDF) vises ikke + automatisk UI-opdatering

### Analyse

Jeg har undersaegt problemet grundigt:

1. **PDF-filer GEmmes korrekt** i bade storage og database (bekraeftet via DB-query — seneste PDF fra i dag, 9.5MB).
2. **Problemet er UI-opdatering**: Efter upload vises filen ikke umiddelbart. Brugeren skal lukke og genabne opgaven.
3. **Fejlhaandtering er for generisk**: Hvis upload fejler, vises kun "Kunne ikke uploade fil" uden den faktiske fejlbesked fra Supabase.
4. **Storage DELETE/UPDATE policies mangler super_admin** — kan blokere filstyring for super_admins.

### Rodaarsag for UI-problem

- `useAssignmentFiles` hooken kalder `fetchFiles()` efter upload, men fejlhaandteringen swallower detaljerne
- Hvis DB-insert fejler (f.eks. RLS), forbliver filen i storage men uden DB-record — filen "forsvinder"
- Hvis mime_type er tom/undefined for PDFs, kan det pavirke visning
- Den globale `RealtimeChangeNotifier` kan interferere med brugerens egne uploads

### AEndringer

#### 1. `src/hooks/assignment/useAssignmentFiles.ts` — Forbedret upload med fejlhaandtering

- **Dispatch `supabase-own-action`** event foer upload for at undgaa global notifier-banner
- **Vis den faktiske fejlbesked** fra Supabase i toast (baade storage og DB fejl)
- **Ryd op i orphaned storage-filer** hvis DB-insert fejler (upload lykkedes men record blev ikke gemt)
- **Fallback mime_type** til `application/octet-stream` hvis `file.type` er tom
- **Vis filnavn i success-toast** saa brugeren ved praecis hvilken fil der blev uploadet

```typescript
// Foer upload:
window.dispatchEvent(new Event('supabase-own-action'));

// Bedre fejlhaandtering:
if (uploadError) {
  toast.error(`Upload fejlede: ${uploadError.message}`);
  return;
}

if (dbError) {
  toast.error(`Kunne ikke gemme fil: ${dbError.message}`);
  // Clean up orphaned storage file
  await supabase.storage.from('assignment-files').remove([filePath]);
  return;
}

// Bedre success-besked:
toast.success(`${file.name} uploadet`);
```

#### 2. `src/components/Assignment/AssignmentFilesPanel.tsx` — Reset filter efter upload

- Naar en fil uploades, saet `filterFolder` til `__all__` saa den nyuploadede fil altid er synlig
- Tilfoej en callback saa panelet kan signalere til parent at filer er aendret

#### 3. SQL Migration — Fix storage.objects policies for super_admin

Erstat inline role-check med `is_admin_or_skadeleder()` (som inkluderer `super_admin`):

```sql
DROP POLICY IF EXISTS "Admin and Skadeleder can delete assignment files" ON storage.objects;
CREATE POLICY "Admin and Skadeleder can delete assignment files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'assignment-files' AND is_admin_or_skadeleder()
  );

DROP POLICY IF EXISTS "Admin and Skadeleder can update assignment files" ON storage.objects;
CREATE POLICY "Admin and Skadeleder can update assignment files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'assignment-files' AND is_admin_or_skadeleder()
  );
```

#### 4. `CHANGELOG.md` — Dokumenter rettelser

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/hooks/assignment/useAssignmentFiles.ts` | Forbedret fejlhaandtering, supabase-own-action dispatch, orphan cleanup |
| `src/components/Assignment/AssignmentFilesPanel.tsx` | Reset filter til __all__ efter upload |
| Ny SQL migration | Fix storage.objects DELETE/UPDATE policies for super_admin |
| `CHANGELOG.md` | Dokumenter rettelser |

