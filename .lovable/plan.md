

## Fix postnummer-gem og tilfoej adresse-felt til medarbejderprofiler

### Problem: Postnummer gemmes ikke

Der er identificeret en bug i demo-tilstand: `home_postcode` mappes ikke i demo-data-transform (`useEmployeeData.ts` linje 48-63). Derudover skal `handleInputChange`-kaldet i `EmployeeFormDialog.tsx` verificeres, da det bruger et syntetisk event-objekt.

### Loesning

---

### Trin 1: Database-migrering

Tilfoej `home_address` kolonne til `profiles`-tabellen:

```text
ALTER TABLE profiles ADD COLUMN home_address text;
```

Ingen constraint - fritekstfelt til adresse.

---

### Trin 2: TypeScript-type

**`src/types/employee.ts`**: Tilfoej `home_address?: string` til `Employee` interface.

---

### Trin 3: Fix demo-data transform

**`src/hooks/employee/useEmployeeData.ts`** (linje 48-63, demo-stien):
- Tilfoej manglende `home_postcode: profile.home_postcode || ''` til demo-transform
- Tilfoej `home_address: profile.home_address || ''`

**Produktions-stien** (linje 96-113):
- Tilfoej `home_address: profile.home_address || ''`
- Tilfoej `home_address` til SELECT-query (linje 71-74)

---

### Trin 4: Form state

**`src/hooks/employee/useEmployeeFormState.ts`**:
- Tilfoej `home_address: string` til `EmployeeFormData` interface
- Tilfoej `home_address: ''` som default i alle reset/prepare-funktioner
- Map `home_address: employee.home_address || ''` i `prepareForEdit`

---

### Trin 5: Data-persistering

**`src/hooks/employee/useEmployeeActions.ts`** (updatePayload linje 83-94):
- Tilfoej `home_address: formData.home_address || null`

**`src/hooks/employee/useEmployeeCreation.ts`**:
- Tilfoej `home_address: userData.home_address || null` til profile insert (linje 53-68)
- Tilfoej `home_address: formData.home_address || null` til profile update (linje 204-218)
- Tilfoej `home_address` til edge function requestBody userData (linje 137-149)

---

### Trin 6: UI - Medarbejder-formular

**`src/components/Employees/EmployeeFormDialog.tsx`**:

Erstat det eksisterende postnummer-felt (linje 245-266) med et grid-layout der viser postnummer og adresse paa samme linje (kun for admin):

```text
{isAdmin && (
  <div className="grid gap-2">
    <Label>{t("employees.homeAddress")}</Label>
    <div className="grid grid-cols-[100px_1fr] gap-2">
      <Input
        id="home_postcode"
        name="home_postcode"
        value={formData.home_postcode || ''}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
          handleInputChange({
            target: { name: 'home_postcode', value: val }
          } as any);
        }}
        maxLength={4}
        inputMode="numeric"
        placeholder="7000"
        disabled={isSubmitting}
      />
      <Input
        id="home_address"
        name="home_address"
        value={formData.home_address || ''}
        onChange={handleInputChange}
        placeholder={t("employees.homeAddressPlaceholder")}
        disabled={isSubmitting}
      />
    </div>
  </div>
)}
```

---

### Trin 7: Tabel-visning

**`src/components/Employees/EmployeesTable.tsx`**: Omdoeb kolonneheader til "Adresse" og vis baade postnummer og adresse.

**`src/components/Employees/EmployeeTableRow.tsx`**: Vis `{employee.home_postcode} {employee.home_address}` i cellen.

**`src/components/Employees/MobileEmployeeCard.tsx`**: Vis postnummer og adresse sammen.

---

### Trin 8: Oversaettelser

**Dansk** (`src/translations/da/employees.ts`):
- `homeAddress: 'Adresse'`
- `homeAddressPlaceholder: 'f.eks. Vestergade 12'`

**Engelsk** (`src/translations/en/employees.ts`):
- `homeAddress: 'Address'`
- `homeAddressPlaceholder: 'e.g. 12 Main Street'`

---

### Trin 9: Dokumentation

- Opdater `docs/technical-specs/database-schema.md` med `home_address`
- Opdater `CHANGELOG.md`

---

### Trin 10: Verifikation

Naviger til /employees, aaben rediger-dialog for en medarbejder, udfyld postnummer og adresse, gem, og bekraeft at data persisteres korrekt.

