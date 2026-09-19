# Fase 1: Kritiske forbedringer

Vi starter med de fund, der påvirker hastighed, dataforbrug og sikkerhed i produktion. Fase 2 (hurtige gevinster) tages bagefter.

## 1. Ugeplanen henter alle opgaver to gange

Ugeplanen henter allerede ugens opgaver via den optimerede datahentning, men indholdet under den henter samtidig **hele afdelingens opgavehistorik uden datobegrænsning** (bekræftet: opgavehentningen i den fælles datatjeneste har intet datofilter). I afdeling 12 er det ca. 1.900 opgaver plus alle tilknyttede medarbejdere og profiler — ved hver indlæsning af siden.

Rettelse:
- Den fælles datahentning får et datovindue (samme vindue som ugeplanen bruger).
- Ugeplanens indhold genbruger de opgaver, det allerede har fået, i stedet for at hente listen igen. Kun medarbejdere og biler hentes fra den fælles kilde.

Forventet effekt: markant hurtigere indlæsning af /planner, især på mobil.

## 2. Unødig genindlæsning ved hvert sideskift

Ved ethvert skift mellem sider tvinges fem datasæt (opgaver, medarbejdere, biler, ferie, vagter) til at hente forfra. Det gør navigation mellem dashboard og ugeplan langsom uden gevinst, fordi live-opdateringer allerede holder data friske.

Rettelse: kun de datasæt, den nye side faktisk bruger, opdateres — og kun hvis de er ældre end den normale friskhedsgrænse. Manuel opdatering og træk-ned på mobil virker uændret.

## 3. Logning i produktion

46 steder skriver til browserens konsol uden udviklingsbeskyttelse — nogle af dem med bruger- og afdelingsdata. Det strider mod de tekniske specifikationer.

Rettelse: alle disse pakkes ind i udviklings-tjek eller fjernes. Egentlige fejl, der skal fanges, sendes videre til fejlovervågningen i stedet.

## 4. Kvalitetstjek

- Typetjek og lint skal være rene.
- Gennemgang af dashboard, ugeplan (standard/kompakt/gitter), medarbejdere og kiosk på både mobil og desktop.
- `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres.

## Tekniske detaljer

- `src/services/data/unifiedDataService.ts`: `fetchAssignments` får `fromDate`/`toDate` og indgår i cache-nøglen; `fetchEmployees`/`fetchCars` uændret.
- `src/hooks/data/useUnifiedData.ts`: nyt valgfrit `options`-argument (datovindue + `includeAssignments`).
- `src/components/Planner/PlannerContent.tsx`: modtager opgaverne som prop (allerede tilgængelige via `weekAssignments` og `PlannerPage`s `useOptimizedAssignments('all')` til serie-søskende); kalder `useUnifiedData` uden opgavehentning.
- `src/components/Layout/MainLayout.tsx`: erstat de fem ubetingede `invalidateQueries` med rute-baseret mapping + `refetchType: 'active'`; behold `notifyOwnAction()`.
- Konsol-oprydning i de 46 uguarderede kald (bl.a. `src/lib/realtimeChannels.ts`, `src/integrations/supabase/client.ts`, error boundaries, `src/utils/*`).
- Ingen databaseændringer i denne fase.
