
## Rediger vikarer med mulighed for at fjerne udløbsdato

Brugeren vil kunne redigere vikarer, herunder ændre deres rolle. Hvis rolle og email ændres, skal udløbsdatoen fjernes automatisk (så de bliver til en almindelig medarbejder).

---

### Ændringer

**1. UI: Vis vikar-info og konverteringsmulighed ved redigering**
`src/components/Employees/EmployeeFormDialog.tsx`

- Tilføj en sektion der vises ved redigering af en vikar (medarbejder med `is_temporary = true`):
  - Vis info om at det er en vikar med udløbsdato
  - Tilføj en checkbox: "Konverter til fast medarbejder" (fjerner `is_temporary` og `expires_at`)
- Når checkboxen aktiveres:
  - Sæt `is_temporary = false`
  - Ryd `expires_at`
  - Gør rolle-dropdown redigerbar (så vikar kan opgraderes til fx servicemedarbejder)
- Gør email-feltet redigerbart for vikarer der konverteres (da de skal have en gyldig email)

**2. Backend: Gem ændringer korrekt**
`src/hooks/employee/useEmployeeActions.ts`

- Udvid `updateEmployee` til at inkludere `is_temporary` og `expires_at` i update-payloaden
- Når `is_temporary` ændres fra `true` til `false`, sæt `expires_at = null`

**3. Translations**
`src/translations/da/employees.ts` og `src/translations/en/employees.ts`

- Tilføj nye oversættelser:
  - `convertToPermanent`: "Konverter til fast medarbejder"
  - `convertToPermanentNote`: "Dette fjerner udløbsdatoen og gør medarbejderen permanent"
  - `currentlyVikar`: "Denne medarbejder er registreret som vikar"
  - `vikarExpiresInfo`: "Udløber: {date}"

---

### Teknisk overblik

```text
+----------------------------------+
| Rediger Medarbejder              |
+----------------------------------+
| Navn: [______]                   |
| Email: [______] (redigerbar*)    |
| Telefon: [______]                |
| Stilling: [______]               |
|                                  |
| --- Vikar info (kun ved edit) ---|
| [!] Denne medarbejder er vikar   |
| Udløber: 15. marts 2026          |
| [x] Konverter til fast medarb.   |
|     (fjerner udløbsdato)         |
|                                  |
| Rolle: [dropdown - redigerbar**] |
+----------------------------------+

*  Email er nu redigerbar for vikarer ved konvertering
** Rolle-dropdown aktiveres når "Konverter" er valgt
```

---

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Employees/EmployeeFormDialog.tsx` | Tilføj vikar-konverteringssektion ved edit |
| `src/hooks/employee/useEmployeeActions.ts` | Inkluder `is_temporary` og `expires_at` i update |
| `src/translations/da/employees.ts` | Nye oversættelser |
| `src/translations/en/employees.ts` | Nye oversættelser |
