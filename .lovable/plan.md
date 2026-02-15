

## Funktionel logik-gennemgang

### Audit-resultat

| Kategori | Fund | Kritisk | Advarsel |
|----------|------|---------|----------|
| Rollerettigheder | 1 fejl | 1 | 0 |
| Fil-upload | 1 manglende validering | 1 | 0 |
| Console-logging | 4 uguardede logs | 0 | 1 |
| Chat + afdelingsstruktur | OK | 0 | 0 |
| Views (Gitter/Kompakt/Standard) | OK | 0 | 0 |
| Login dynamisk undertitel | OK | 0 | 0 |

---

### KRITISK: Fejl der skal rettes

#### 1. `super_admin` kan ikke slette andres chat-beskeder

**Fil:** `src/components/Assignment/AssignmentMessagesPanel.tsx`, linje 73

```typescript
// NUVAERENDE (fejl):
return ['administrator', 'skadeleder'].includes(user.role || '');

// RETTET:
return ['super_admin', 'administrator', 'skadeleder'].includes(user.role || '');
```

En Super Admin kan ikke slette andres beskeder i chat-panelet, fordi rollen mangler i listen. Administrator og Skadeleder kan, men Super Admin er udeladt.

#### 2. Fil-upload mangler stoerrelsesbegransning

**Fil:** `src/hooks/assignment/useAssignmentFiles.ts`, `uploadFile`-funktionen (linje 113-157)

Der er ingen validering af filstoerrelse foer upload. Profilbillede-upload har en 5MB-graense (ProfilePictureDialog), men assignment-filer har ingen. En bruger kan uploade vilkaarligt store filer.

**Rettelse:** Tilfoej en 20MB-graense (matcher Supabase Storage standard) med brugervenlig fejlbesked foer upload-kaldet:

```typescript
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

if (file.size > MAX_FILE_SIZE) {
  toast.error('Filen er for stor. Maksimal stoerrelse er 20MB.');
  return;
}
```

---

### ADVARSEL: Resterende console.logs i produktion

Disse logs blev overset i den forrige performance-optimering:

| Fil | Linje | Indhold |
|-----|-------|---------|
| `src/components/Planner/PlannerContent.tsx` | 62 | Logger antal assignments, employees, cars |
| `src/components/Layout/TopNavbar.tsx` | 43-48 | Logger vacation request status med emoji |
| `src/components/Layout/TopNavbar.tsx` | 56 | Logger pending vacation notification |
| `src/components/Layout/TopNavbar.tsx` | 115-120 | Logger alle navigation items |

**Rettelse:** Wrap alle 4 steder i `import.meta.env.DEV` guard.

---

### Verificerede omraader (ingen fejl)

**Chat + afdelingsstruktur:**
- `isChatEnabled` og `isFilesEnabled` styrer korrekt visning i `AssignmentDetailsDialog`
- Chat-panelet filtrerer ikke data per afdeling (beskeder er knyttet til en specifik opgave, som allerede er filtreret per underafdeling via RLS)

**Rollerettigheder i UI:**
- `isEffectiveAdmin` inkluderer korrekt baade `super_admin` og `administrator` (AuthContext linje 543)
- Admin-fane er korrekt skjult for ikke-admins via `adminOnly` filter i TopNavbar
- Super Admin-rolle er kun synlig i brugerformularer hvis den autentificerede bruger selv er `super_admin` (UserFormDialog, EmployeeFormDialog)
- `canPublishTasks`, `canEdit`, `canCreate` inkluderer korrekt `super_admin` via `isAdmin`-flaget

**Views (Gitter/Kompakt/Standard):**
- PlannerContent renderer korrekt baseret paa `viewMode` prop
- Kompakt-view bruger separate komponenter (CompactCurrentAndFutureDays/CompactPastAssignments)
- Grid-view bruger `gridLayout` prop paa standard-komponenterne
- Alle tre views bruger samme data og expandedDays-logik

**Login dynamisk undertitel:**
- LoginPage laeser `selected_department_id` fra localStorage og henter afdelingsnavnet
- Fallback til "Internt planlagningssystem" hvis ingen afdeling er gemt
- Fungerer korrekt

---

### Konkrete aendringer

| Fil | AEndring |
|-----|---------|
| `src/components/Assignment/AssignmentMessagesPanel.tsx` | Tilfoej `'super_admin'` til canDeleteMessage rolle-liste |
| `src/hooks/assignment/useAssignmentFiles.ts` | Tilfoej 20MB filstoerrelses-validering foer upload |
| `src/components/Planner/PlannerContent.tsx` | Wrap console.log (linje 62) i `import.meta.env.DEV` |
| `src/components/Layout/TopNavbar.tsx` | Wrap 3 console.log kald (linje 43, 56, 115) i `import.meta.env.DEV` |
| `CHANGELOG.md` | Tilfoej alle rettelser under "Funktionel logik-gennemgang - 2026-02-15" |

### Hvad der IKKE aendres

- UI-design og layout forbliver identisk
- Ingen database-aendringer
- Ingen nye features - kun fejlrettelser

