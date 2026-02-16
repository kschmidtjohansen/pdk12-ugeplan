

## Fix: Brugeroprettelse fejler + manglende afdelingstilknytning

### Situationsanalyse

Fejlen "Edge Function returned a non-2xx status code" skyldes at Michael Rattenborg allerede blev oprettet ved forste forsog (kl. 14:47). Brugeren vises ikke fordi `user_access`-tabellen mangler en raekke for afdeling "16 - Asnaes". Det underliggende problem er at formularen ikke pre-selecter den aktive afdeling.

### Trin 1: Pre-select aktuel afdeling ved oprettelse

**`src/components/Admin/UserFormDialog.tsx`**

- Importer `useDepartment` fra `@/context/DepartmentContext`
- Tilfoej `const { selectedDepartmentId } = useDepartment();`
- Tilfoej en `useEffect` der pre-selecter den aktive afdeling ved oprettelse (ikke redigering):

```text
useEffect(() => {
  if (!currentUser && selectedDepartmentId && selectedDeptIds.length === 0) {
    setSelectedDeptIds([selectedDepartmentId]);
  }
}, [currentUser, selectedDepartmentId]);
```

### Trin 2: Validering - kraev mindst en afdeling

I `handleFormSubmit`, tilfoej validering foer brugeroprettelse:

```text
if (selectedDeptIds.length === 0) {
  setErrorMessage('Vaelg mindst en afdeling for brugeren');
  setIsSubmitting(false);
  return;
}
```

Placer dette efter telefon-valideringen (linje 224) og foer password-valideringen (linje 226).

### Trin 3: Bedre fejlhaandtering for duplikerede brugere

Edge function returnerer allerede en fejlbesked "A user with this email address has already been registered". Fejlhaandteringen i `handleFormSubmit` (linje 294) fanger dette korrekt. Ingen aendringer noedvendige her.

### Trin 4: Opdater CHANGELOG.md

Tilfoej entry om pre-select af aktuel afdeling og validering.

---

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/components/Admin/UserFormDialog.tsx` | Import useDepartment, pre-select afdeling, valider mindst 1 afdeling |
| `CHANGELOG.md` | Dokumenter fix |

### Tekniske detaljer

Samlet set er der 3 aendringer i `UserFormDialog.tsx`:

1. **Linje 16**: Tilfoej import af `useDepartment`
2. **Linje 82** (efter `useAuth`): Tilfoej `const { selectedDepartmentId } = useDepartment();` og en useEffect til pre-select
3. **Linje 224** (efter phoneValidation): Tilfoej validering for mindst 1 afdeling

### Kvalitetstjek

- Pre-select koerer kun ved oprettelse (guard: `!currentUser`)
- Brugeren kan stadig aendre/tilfoeje flere afdelinger manuelt
- Validering forhindrer at brugere oprettes uden tilknytning
- Eksisterende redigeringsflow paavirkes ikke (linje 131-154 haandterer edit)
- Fejlbesked for duplikerede brugere vises allerede korrekt

