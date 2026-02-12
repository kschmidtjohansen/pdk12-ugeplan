

## Sikkerhedsgennemgang: Fundne problemer og rettelser

### Oversigt over fundne problemer

Jeg har identificeret **7 sikkerhedsproblemer** opdelt i 3 kategorier: kritiske, vigtige og advarsler.

---

### KRITISK 1: Hardkodet demo-adgangskode i kildekoden

**Fil:** `src/services/secureDemo.ts` (linje 32)

**Problem:** Adgangskoden `TesterbrugerPlan123` er hardkodet direkte i kildekoden. Selvom den kun eksponeres i development-mode, er den synlig i Git-historik og i det bundlede JavaScript (Vite erstatter `process.env.NODE_ENV` men strengen forbliver i koden).

**Rettelse:** Erstat den hardkodede adgangskode med en reference til en environment-variabel (`import.meta.env.VITE_DEMO_PASSWORD`), ligesom `src/config/security.ts` allerede goer korrekt. Funktionen returnerer `undefined` hvis variablen ikke er sat.

**Paavirkede filer:** Kun `src/services/secureDemo.ts` linje 32.

---

### KRITISK 2: RLS-policy med `WITH CHECK (true)` paa `on_call_duties`

**Problem:** Policyen "Users can reassign their own duties" (UPDATE) har `USING (employee_id = auth.uid())` men `WITH CHECK (true)`. Det betyder at en medarbejder der ejer en vagt, kan opdatere den og saette `employee_id` til en vilkaarlig anden bruger eller aendre andre felter frit.

**Rettelse:** AEndr `WITH CHECK (true)` til `WITH CHECK (employee_id = auth.uid())` saa brugere kun kan saette sig selv som ansvarlig (ikke overflytte vagten til andre uden tilladelse). Alternativt, hvis reassignment er tiltaenkt, kan vi kraeve at `employee_id IS NOT NULL`.

**Paavirkede filer:** SQL migration (ny migration fil).

---

### VIGTIG 1: `assignment_messages` og `assignment_files` er laesbare for alle autentificerede brugere

**Problem:** Begge tabeller har SELECT-policies med `USING (auth.uid() IS NOT NULL)`, hvilket betyder at enhver logget-ind bruger kan laese beskeder og filer fra sager de ikke er tildelt.

**Rettelse:** Opdater SELECT-policies til at kraeve at brugeren enten er admin/skadeleder, er tildelt opgaven (via `assignments_employees`), eller er ansvarlig for opgaven.

**Paavirkede filer:** SQL migration (ny migration fil) - 2 policies der opdateres.

---

### VIGTIG 2: `profiles`-tabellen har modstridende PERMISSIVE RLS-policies

**Problem:** Der er to `ALL`-policies (`block_service_role_access` og `block_service_role_profiles`) med `USING (false)`. Disse er PERMISSIVE (ikke RESTRICTIVE), saa de blokerer faktisk intet - de giver bare "ingen adgang" som en af flere PERMISSIVE policies, men andre PERMISSIVE policies overruler dem. Disse policies har ingen sikkerhedseffekt og skaber forvirring.

**Rettelse:** Denne fejl er kosmetisk/forvirrende men pavirker ikke faktisk sikkerheden negativt (andre policies giver allerede adgang). Fjernelse af dem ville goere policy-settet mere overskueligt, men da reglen er "fjern aldrig kode uden tilladelse", noterer jeg det som en observation. Ingen kodeaendring.

---

### ADVARSEL 1: Alle edge functions bruger `Access-Control-Allow-Origin: *`

**Problem:** Alle 12 edge functions tillader requests fra alle originer. `admin-reset-password` har allerede origin-validering i sin logik, men de andre functions har ikke.

**Rettelse:** Da edge functions er beskyttet af JWT-autentificering og admin-rolletjek, er den reelle risiko lav. Men for defense-in-depth anbefales det at tilfoeje origin-validering i de admin-relaterede functions. Dog kraever dette ogsaa at vide hvilke domainer der er gyldige, og det kan bryde eksisterende integrationer. **Jeg anbefaler at springe denne over for nu** da det kraever koordinering med deployment og kan pavirke funktionalitet.

---

### ADVARSEL 2: `on_call_duties` har SELECT `USING (true)` (uden auth)

**Problem:** Vagtplaner er laesbare for alle - ogsaa uautoriserede brugere.

**Rettelse:** AEndr policyen "Anyone can view on call duties" fra `USING (true)` til `USING (auth.uid() IS NOT NULL)` saa kun autentificerede brugere kan se vagtplaner.

**Paavirkede filer:** SQL migration.

---

### ADVARSEL 3: `departments` og `sub_departments` har SELECT `USING (true)` (uden auth)

**Problem:** Organisationsstruktur er laesbar for alle uautoriserede brugere.

**Rettelse:** AEndr til `USING (auth.uid() IS NOT NULL)`.

**Paavirkede filer:** SQL migration.

---

## Implementeringsplan

### Trin 1: Fjern hardkodet adgangskode (KRITISK)
- **Fil:** `src/services/secureDemo.ts`
- **AEndring:** Linje 32 - erstat `'TesterbrugerPlan123'` med `import.meta.env.VITE_DEMO_PASSWORD`

### Trin 2: SQL migration for RLS-rettelser (KRITISK + VIGTIG + ADVARSLER)
- **Ny migration fil** med foelgende aendringer:

```text
1. on_call_duties: Opdater "Users can reassign their own duties"
   WITH CHECK (true) -> WITH CHECK (employee_id = auth.uid())

2. assignment_messages: Opdater "Users can read assignment messages"
   USING (auth.uid() IS NOT NULL) -> USING (auth.uid() IS NOT NULL AND (
     is_admin_or_skadeleder() OR
     EXISTS (SELECT 1 FROM assignments_employees ae WHERE ae.assignment_id = assignment_messages.assignment_id AND ae.user_id = auth.uid()) OR
     EXISTS (SELECT 1 FROM assignments a WHERE a.id = assignment_messages.assignment_id AND a.responsible_user_id = auth.uid())
   ))

3. assignment_files: Opdater "Users can read assignment files"
   Samme moenster som punkt 2.

4. on_call_duties: Opdater "Anyone can view on call duties"
   USING (true) -> USING (auth.uid() IS NOT NULL)

5. departments: Opdater "Anyone can view departments"
   USING (true) -> USING (auth.uid() IS NOT NULL)

6. sub_departments: Opdater "Authenticated users can view sub_departments"
   Allerede korrekt (USING (true) men navngivet "Authenticated" - verificer om det faktisk kraever auth)
```

### Hvad jeg IKKE retter (og hvorfor)

| Problem | Grund til at springe over |
|---------|--------------------------|
| `profiles` fuld laesbarhed | Bruges aktivt af planner, employee-selector, dashboards. AEndring ville bryde medarbejder-visning for servicemedarbejdere |
| `cars` fuld laesbarhed | Bruges af planner/car-selector for alle brugere. Fuel codes haandteres allerede via en separat RPC-funktion |
| `warehouse_items` fuld laesbarhed | Bruges af alle medarbejdere til at se lagerstatus |
| CORS `*` i edge functions | Lav risiko pga. JWT-beskyttelse; aendring kunne bryde deployment |
| `block_service_role_*` policies | Kosmetisk problem, ingen sikkerhedsrisiko |
| Oversaettelser/UI | Eksplicit udelukket af constraints |

