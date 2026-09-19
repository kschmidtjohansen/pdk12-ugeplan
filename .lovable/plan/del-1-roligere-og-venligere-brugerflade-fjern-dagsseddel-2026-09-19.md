# Del 1: Roligere og venligere brugerflade (+ fjern dagsseddel)

## 0. Fjern dagssedlen
Funktionen bruges ikke og fjernes helt:
- "Dagsseddel"-knappen forsvinder fra dagsoverskriften i både Standard- og Kompakt-visningen i ugeplanen.
- Selve PDF-genereringen og knapkomponenten slettes fra koden.
- CHANGELOG og opgavelisten opdateres, så det fremgår at funktionen er fjernet igen.

## 1. Vagtplan og ferieoverblik får samme rolige udtryk som ugeplanen
- Vagtlisten og feriekortene får afrundede kort, blødere kanter og samme afstande som ugeplanen i stedet for stramme grå tabellinjer.
- Hver vagtdag får en diskret dækningsindikator: rolig grøn når vagten er dækket, dæmpet gul/orange når den mangler.
- Feriekalenderen får samme farvetoner og afrunding, så de tre sider ligner hinanden.

## 2. "Hvem kører bilen i dag" på biloversigten
- Hvert bilkort/-række får en lille ekstra linje: dagens bruger, fx "I dag: Ronnie Jensen".
- Er bilen ikke tildelt i dag, står der en dæmpet "Ikke booket i dag".
- Oplysningen udledes af dagens opgaver i den valgte afdeling — ingen nye felter eller ekstra datakald.

## 3. Konsekvent to-trins informationshierarki
- Primær information (kunde/adresse, navn, tidspunkt) står mørkere og lidt kraftigere.
- Sekundær information (sagsnummer, postnummer, type, tekniske detaljer) bliver dæmpet grå.
- Farve reserveres til faktiske advarsler: overlap, fravær og manglende bemanding. Øvrige badges bliver neutrale.
- Gennemføres på opgavekort, medarbejderliste, biloversigt, vagt og ferie.

## 4. Mobilmenuen justeres til hverdagens brug
Bundmenuen findes allerede. Den tilpasses, så den matcher det man reelt bruger på telefonen:
- Faner: Min Dag (forsiden), Ugeplan, Vagter, Mere.
- Aktiv fane markeres tydeligere, og alle faner overholder 44×44 px trykflade.
- Menupunkter, brugeren ikke har adgang til, vises ikke.

## Teknisk
- Kun præsentation: ingen ændringer i data, RLS, rettigheder eller forretningslogik.
- Alle farver via de semantiske tokens i `src/index.css` — ingen faste farveklasser.
- Alle tekster gennem oversættelseslaget (DA/EN).
- Filer der berøres: `PrintDayReportButton.tsx` og `dayReportPdf.ts` (slettes), `DaySection.tsx`, `CompactDaySection.tsx`, `DutyList.tsx`, `DutyCalendar.tsx`, `DutyMonthCalendar.tsx`, vagt-/feriekomponenter, `CarsList.tsx`, `CarsTable.tsx`, `MobileCarCard.tsx`, `MobileBottomNav.tsx`, `AssignmentCard.tsx`.
- Bilens "i dag"-linje beregnes ud fra de opgaver, der allerede er hentet for den aktive afdeling.
- Verifikation: typetjek, kodetjek, visuel kontrol i Standard/Kompakt/Gitter på både mobil- og desktopbredde.
- CHANGELOG.md og `docs/implementation-plan/tasks.md` opdateres til sidst.
