# Status-piller med fokus-visninger + mobiltilpasning af forsiden

## Hvad brugeren får
- Hver pille øverst åbner sin egen fokus-visning: et ark nedefra på telefon og et lille vindue på computer.
  - **Vagt:** Dagens vagter (skadeledervagt og kørevagt) med navn, telefonnummer, store "Ring"- og "SMS"-knapper og et link til vagtplanen. Resten af ugens vagter vises kort nedenunder.
  - **Ledige medarbejdere:** Hvem der er ledige lige nu, med "Ring"-knap pr. person. Kan skiftes til "Optaget", der viser hvilken sag de er på. "Se hele listen" åbner den nuværende oversigt.
  - **Ledige biler:** Ledige biler og hvem der har de optagede biler.
  - **Vikarer der udløber:** Hver vikar med antal dage tilbage og en "Forlæng"-knap.
- På telefonen:
  - Den øverste bjælke bliver kompakt: kortere hilsen, og søgningen folder sig ud til fuld bredde, når man trykker på den.
  - Pillerne kan skubbes vandret, er mindst 44 px høje og viser en blød kant, når der er flere piller.
  - Fanerne "I dag" / "Ugens overblik" fylder hele bredden og bliver hængende øverst, når man ruller.
  - Tidslinjen bliver strammere: tiden står i en smal kolonne til venstre, én linje med adresse, og holdet og bilerne vises som små mærker. Når man åbner "I dag", ruller siden automatisk hen til sagen, der er i gang.
  - Nøgletal, ferier og genveje flyttes ned under fanerne i en sammenfoldet sektion "Mere", så dagens sager kommer først.

## Tekniske detaljer
- Ny `Dashboard/StatusDetailSheet.tsx`: fælles skal (vaul `Drawer` når `useIsMobile()`, ellers `Popover`/`Dialog`) med fast header og en krop, der kan rulles.
- Nye paneler: `DutyDetailPanel`, `AvailableEmployeesPanel`, `AvailableCarsPanel` og `ExpiringTempsPanel`. De genbruger data, som `CommandBar` allerede henter (`useDutyData`, `useEmployees`, `useDashboardMetrics`). Der kommer ingen nye opslag og ingen ændringer i databasen.
- `CommandBar` får én `openPanel`-tilstand i stedet for de nuværende popovers. `EmployeeAvailabilityDialog` og `CarAvailabilityModal` kan fortsat nås via "Se hele listen".
- `GlobalSearch`: på skærme under `sm` vises en ikon-knap, der folder søgningen ud til fuld bredde (tryk på `/` virker stadig).
- `DashboardCockpit`: `TabsList` med `w-full grid grid-cols-2 sm:w-auto` og `sticky top-14 z-10`. På mobil ligger højre kolonne i en `Collapsible`.
- `TodayTimeline`: grid-layout `[3.5rem_1fr]` på mobil og `scrollIntoView` på den aktive sag, når fanen åbnes.
- Kun semantiske tokens, touch-mål på mindst 44 px, og visningen fungerer i Standard, Kompakt og Gitter. CHANGELOG.md og /docs/implementation-plan opdateres.
