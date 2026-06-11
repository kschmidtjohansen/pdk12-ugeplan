## Plan

1. **Ret den faktiske årsag i medarbejderdata**
   - Problemet er sandsynligvis, at Jonas som `fugttekniker` ikke kan læse alle andres `user_roles` via RLS.
   - Når roller mangler i klientdata, falder `useEmployeeData` i dag tilbage til `servicemedarbejder`, så skadeledere/fugtteknikere fejlagtigt kan blive behandlet som servicemedarbejdere.
   - Jeg ændrer fallback-logikken, så manglende roller ikke automatisk tæller som servicemedarbejder i Jonas’ KPI/dialog-view.

2. **Gør dashboard-filtreringen robust**
   - Flyt/ensret rolle-checket i `useDashboardMetrics.ts` og `useEmployeeDialogData.ts`, så fugttekniker/servicemedarbejder kun får medarbejdere med en verificeret `servicemedarbejder`-rolle.
   - Hvis rolledata mangler for en medarbejder, skal personen ikke vises i denne metric for fugttekniker/servicemedarbejder.

3. **Valider mod databasen og preview-signalet**
   - Bekræft Jonas’ faktiske rolle og afdeling mod databasen.
   - Tjek at listen matcher de 10 servicemedarbejdere og ikke inkluderer jobtitler som skadeleder/fugttekniker.

4. **Opdater dokumentation**
   - Tilføj præcis changelog-entry.
   - Marker rettelsen i `/docs/implementation-plan/tasks.md` under løbende rettelser.

## Tekniske detaljer

- Ingen ændringer i adgangsrettigheder eller RLS uden behov.
- Ingen `{public} USING(true)` policies.
- Ingen brug af `.or('department_id.is.null')`.
- Ændringen holdes til frontend-datafiltrering og dokumentation, medmindre implementeringen viser, at en lille sikker RPC er nødvendig for korrekt rolledata.