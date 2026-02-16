

## Fase 5, Del 1: Geografisk Grundlag - Tilfoej `home_postcode` til medarbejderprofiler

### Oversigt

Tilfoej et nyt felt `home_postcode` (privat postnummer, 4-cifret dansk format) til profiles-tabellen og medarbejder-UI'en. Feltet er kun synligt og redigerbart for admin-brugere.

---

### Trin 1: SQL-migrering

Tilfoej kolonnen `home_postcode` til `profiles`-tabellen med en CHECK-constraint der sikrer dansk 4-cifret format:

```text
ALTER TABLE profiles 
ADD COLUMN home_postcode text;

ALTER TABLE profiles 
ADD CONSTRAINT postcode_format_check 
CHECK (home_postcode IS NULL OR home_postcode ~ '^\d{4}$');
```

Kolonnen er nullable (ikke alle medarbejdere har indtastet postnummer endnu).

---

### Trin 2: TypeScript-type opdatering

**`src/types/employee.ts`**: Tilfoej `home_postcode?: string` til `Employee` interface.

---

### Trin 3: Form state

**`src/hooks/employee/useEmployeeFormState.ts`**: 
- Tilfoej `home_postcode: string` til `EmployeeFormData` interface
- Tilfoej default-vaerdi `home_postcode: ''` i alle reset/prepare-funktioner
- Map `employee.home_postcode || ''` i `prepareForEdit`

---

### Trin 4: Data-lag

**`src/hooks/employee/useEmployeeData.ts`**: 
- Tilfoej `home_postcode` til SELECT-query (linje 73)
- Map `home_postcode: profile.home_postcode || ''` i transform (linje 96-112)

**`src/hooks/employee/useEmployeeActions.ts`**:
- Tilfoej `home_postcode: formData.home_postcode || null` til updatePayload (linje 83-94)

**`src/hooks/employee/useEmployeeCreation.ts`**:
- Tilfoej `home_postcode` til profile insert og update payloads

---

### Trin 5: Medarbejder-formular

**`src/components/Employees/EmployeeFormDialog.tsx`**:
- Tilfoej nyt felt efter "jobTitle" (kun synligt naar `isAdmin` er true):

```text
{isAdmin && (
  <div className="grid gap-2">
    <Label htmlFor="home_postcode">{t("employees.homePostcode")}</Label>
    <Input 
      id="home_postcode" 
      name="home_postcode" 
      value={formData.home_postcode} 
      onChange={handleInputChange}
      maxLength={4}
      pattern="\d{4}"
      placeholder="f.eks. 7000"
      disabled={isSubmitting}
    />
  </div>
)}
```

- Tilfoej klient-side validering i `handleFormSubmit`: Hvis `home_postcode` er udfyldt men ikke matcher `/^\d{4}$/`, vis fejl.

---

### Trin 6: Tabel-visning (kun admin)

**`src/components/Employees/EmployeesTable.tsx`**:
- Tilfoej kolonne-header `{isAdmin && <TableHead>{t('employees.postcode')}</TableHead>}` efter "Certificates"

**`src/components/Employees/EmployeeTableRow.tsx`**:
- Tilfoej `{isAdmin && <TableCell>{employee.home_postcode || '-'}</TableCell>}` efter certificates-cellen

**`src/components/Employees/MobileEmployeeCard.tsx`**:
- Vis postnummer i admin-sektionen (under rolle-badge)

---

### Trin 7: Oversaettelser

**`src/translations/da/employees.ts`**: Tilfoej:
- `homePostcode: 'Postnummer'`
- `postcode: 'Postnr.'`
- `postcodeInvalid: 'Postnummer skal vaere 4 cifre'`

**`src/translations/en/employees.ts`**: Tilfoej:
- `homePostcode: 'Postcode'`
- `postcode: 'Postcode'`
- `postcodeInvalid: 'Postcode must be 4 digits'`

---

### Trin 8: Dokumentation

**`docs/technical-specs/database-schema.md`**: Tilfoej `home_postcode` til profiles-dokumentation.

**`docs/implementation-plan/tasks.md`**: Marker "Fase 5: Del 1" som faerdigt.

**`CHANGELOG.md`**: Tilfoej entry under ny sektion.

---

### Kvalitetstjek

- CHECK constraint paa databaseniveau forhindrer ugyldige postnumre
- Klient-side validering med `pattern` og maxLength som ekstra lag
- Kun admin-brugere kan se og redigere feltet (isAdmin guard)
- Ingen foelsom data logges
- Responsive: Vises i baade tabel og mobil-kort
- RLS uaendret (eksisterende profile-policies daekker den nye kolonne)

