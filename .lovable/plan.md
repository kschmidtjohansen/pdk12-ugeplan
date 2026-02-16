

## Fix: Medarbejder-data gemmes ikke (RLS-policy bug)

### Problem

Databasen returnerer status 204 (OK) men opdaterer faktisk 0 raekker. Aarsagen er RLS-policyen `secure_profile_updates`, som kun tillader `administrator`-rollen at opdatere andre brugeres profiler. Din bruger har rollen `super_admin`, som **ikke** er inkluderet i policyen.

Det er derfor postnummer, adresse og alle andre felter ikke gemmes, naar du redigerer en medarbejder.

### Loesning

Opdater RLS-policyen `secure_profile_updates` til ogsaa at inkludere `super_admin`-rollen i baade `USING` og `WITH CHECK`:

```text
-- Fra:
ur.role = 'administrator'::user_role

-- Til:
ur.role IN ('administrator'::user_role, 'super_admin'::user_role)
```

### Teknisk detalje

Der er to steder i policyen der skal aendres:
1. **USING-clause**: Bestemmer hvilke raekker der kan ses/opdateres
2. **WITH CHECK-clause**: Bestemmer om den nye data er tilladt

Begge steder filtrerer kun paa `administrator` og skal udvides med `super_admin`.

### Aendringer

1. **Database-migrering**: DROP den gamle policy og opret en ny med korrekt rollecheck
2. **Verifikation**: Test at postnummer og adresse gemmes korrekt for Bjarke
3. **Dokumentation**: Opdater CHANGELOG.md

### Kvalitetstjek

- Aendringen paavirker kun UPDATE-operationer paa profiles-tabellen
- super_admin faar samme rettigheder som administrator (hvilket er forventet)
- Ingen sensitiv data eksponeres - det er kun skriverettigheder der udvides
