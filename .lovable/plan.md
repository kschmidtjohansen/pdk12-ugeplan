

## Fix: Duplikeret tom fuel_card_code blokerer oprettelse af anden bil

### Problem
Naar Michael opretter biler i afdeling 16, kan han kun oprette en enkelt bil. Derefter fejler alle efterfoelgende oprettelser med `duplicate key value violates unique constraint "unique_fuel_card_code_per_dept"`.

Aarsagen: Michael har ikke rettighed til at se/udfylde braendstofkort-koden (`canViewFuelCardCode = false`). Derfor saettes `fuel_card_code` til tom streng `''` for alle hans biler. Databasens unique constraint `UNIQUE (fuel_card_code, department_id)` tillader kun en enkelt bil med tom fuel_card_code per afdeling.

### Loesning
I `CarSecurityService.createCar()`: Naar brugeren ikke har adgang til fuel_card_code-feltet, generer en unik placeholder-vaerdi i stedet for tom streng. Dette sikrer at unique constraint ikke blokerer.

### Aendringer

**`src/services/carSecurityService.ts`** (linje 90-94)

Erstat:
```text
if ((canViewFuel || canViewFuelCardCode) && carData.fuel_card_code) {
  insertData.fuel_card_code = carData.fuel_card_code;
} else {
  insertData.fuel_card_code = carData.fuel_card_code || '';
}
```

Med:
```text
if ((canViewFuel || canViewFuelCardCode) && carData.fuel_card_code) {
  insertData.fuel_card_code = carData.fuel_card_code;
} else if (!carData.fuel_card_code || carData.fuel_card_code.trim() === '') {
  // Generate unique placeholder to avoid unique constraint violation
  insertData.fuel_card_code = `AUTO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
} else {
  insertData.fuel_card_code = carData.fuel_card_code;
}
```

**`CHANGELOG.md`** - Dokumenter rettelsen.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/services/carSecurityService.ts` | Unik placeholder for tom fuel_card_code |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Flere biler kan oprettes i samme afdeling uden fuel_card_code
- Eksisterende biler med tom fuel_card_code paavirkes ikke (kun nye)
- Brugere med fuel_card_code-adgang kan stadig angive koder manuelt
- Ingen console.log uden DEV-guard
- Overholder tekniske specifikationer for database-constraints

