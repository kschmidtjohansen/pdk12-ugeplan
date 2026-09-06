# Fejl på Dashboard: "Data Fetch Error"

## Hvad der sker

Når flere dele af siden lytter efter live-opdateringer på samme emne (fx kursusdatoer), forsøger de at oprette den samme lytte-forbindelse igen. Systemet afviser det med beskeden "cannot add postgres_changes callbacks ... already subscribed", og hele dashboardet vises som en fejlboks i stedet for indhold.

Bekræftet i koden: flere steder oprettes forbindelser med et fast navn (kursus, ændringslog, notifikationer, brugeradministration, kioskvisning). På dashboardet bruges kursus-lytteren af mindst fem forskellige dele samtidig, som alle bruger nøjagtig samme navn.

## Plan

1. **Genbrug forbindelser i stedet for at oprette dubletter**
   - Projektet har allerede en fælles hjælper, der genbruger én forbindelse pr. emne og tæller lyttere. Den bruges bare ikke alle steder.
   - Læg kursus-lytterne (både dags- og uge-varianten) om til den fælles hjælper, så fem samtidige brugere af samme data deler én forbindelse.

2. **Samme rettelse de øvrige steder med fast navn**
   - Ændringslog, live-besked-boblen, brugeradministration og kioskvisning lægges om på samme måde, så fejlen ikke kan opstå igen ved genindlæsning eller skift af afdeling.

3. **Fejlen må ikke vælte hele siden**
   - Selv hvis en live-forbindelse fejler, skal dashboardet stadig vise data (live-opdatering kan så udeblive indtil næste manuelle opdatering) i stedet for at vise den røde fejlboks.

4. **Kvalitetstjek**
   - Typetjek, gennemgang på mobil og desktop af dashboard, planner, kiosk og ændringslog, samt opdatering af `CHANGELOG.md`.

## Tekniske detaljer

- Fejlkilde: `supabase.channel(<fast navn>)` returnerer en allerede tilsluttet kanal; efterfølgende `.on('postgres_changes', ...)` kaster.
- Berørte filer: `src/hooks/useActiveTrainings.ts` (2 kanaler), `src/context/ChangeLogContext.tsx`, `src/components/shared/RealtimeChangeNotifier.tsx`, `src/components/Admin/UserManagement.tsx`, `src/pages/ScreenDisplayPage.tsx`.
- Løsning: brug `subscribeToTable` / `subscribeToTables` fra `src/lib/realtimeChannels.ts` med unik caller-key (fx `active-trainings:<dept>:<dato>:<instans-id>`), som allerede ref-tæller og river kanalen ned korrekt.
- `DataFetchErrorBoundary`/datahentning må ikke behandle abonnementsfejl som datafejl; abonnementsopsætning wrappes i try/catch og logges kun i DEV.
