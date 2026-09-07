# Plan: Fjern den vedvarende realtime-fejl på Dashboard

## Bekræftet årsag
- Fejlens kanalnavn (`active-trainings-…`) stammer fra den tidligere direkte Supabase-lytter.
- Den aktuelle kildekode bruger allerede den nye delte realtime-løsning og opretter ikke dette kanalnavn.
- Appen er konfigureret som PWA med cachede JavaScript-filer, men har ingen synlig/aktiv håndtering, der sikrer, at en åben eller installeret app straks skifter fra en gammel programversion til den nye. Fejlen kan derfor fortsætte fra en gammel browserpakke, selv om kildekoden er rettet.

## Ændringer
1. **Sikker PWA-opdatering**
   - Registrér opdateringshåndtering eksplicit, så en ny udgave aktiveres og siden genindlæses kontrolleret én gang.
   - Kontrollér regelmæssigt for en ny version, så langvarigt åbne dashboard-skærme ikke bliver hængende på gammel kode.
   - Ryd kun forældede app-caches; login/session og brugerdata i browseren bevares.

2. **Realtime-livscyklus**
   - Gør den delte realtime-manager robust ved hurtig afmontering/genmontering, så en kanal under asynkron lukning ikke kan kollidere med en ny kanal.
   - Bevar én fysisk `trainings`-kanal pr. afdeling/filter og fan-out til dashboardets forskellige visninger.
   - En realtime-fejl må ikke vælte dashboardets almindelige datahentning.

3. **Verifikation**
   - Tilføj målrettede tests for gentagen subscribe/unsubscribe og React Strict Mode-lignende genmontering.
   - Verificér typecheck/build samt dashboard i desktop- og mobilbredde uden “Data Fetch Error”.
   - Bekræft, at kursusændringer fortsat opdaterer dashboardet automatisk.

4. **Dokumentation**
   - Opdatér implementeringslisten og changelog med rettelsen.

## Tekniske noter
- Ingen database- eller rettighedsændringer er nødvendige; fejlen opstår i browserens realtime/PWA-livscyklus.
- Den gamle kanalstreng fjernes ikke via en databaseændring — brugeren flyttes automatisk over på den aktuelle app-version.
