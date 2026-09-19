# Del 2: "Min Dag" til teknikere + PDF-dagseddel

To leverancer, bygget i rækkefølge. Ingen ændringer i datamodel, adgangsstyring eller forretningsregler — alt bygger på de opgaver, medarbejderen allerede har adgang til.

## A. "Min Dag" som forside for servicemedarbejdere

Servicemedarbejderens forside åbner med dagens rute i stedet for statistikkort.

- Øverst: dato, ugedag, antal opgaver i dag og første mødetid.
- Dagens opgaver i kronologisk rækkefølge som store, letlæselige kort:
  - tidsrum (fra–til), titel/sagsnummer
  - fuld adresse
  - kollegaer på opgaven og hvem der er ansvarlig
  - bil(er) tilknyttet opgaven
  - lagerinfo (møbelkasser/paller), hvis der er noget på opgaven
- Handlinger direkte på kortet:
  - "Kør dertil" — åbner adressen i telefonens kortapp (Google Maps/Apple Maps via standard-kort-URL)
  - "Ring" — direkte opkald til opgavens ansvarlige, når der er et telefonnummer på profilen; ellers skjules knappen
  - Tryk på kortet åbner de fulde opgavedetaljer som i dag
- Den aktuelle opgave (tidsrummet vi er inde i) fremhæves roligt; overståede opgaver dæmpes.
- Er der ingen opgaver i dag: en rolig tom-tilstand med "Næste opgave" (førstkommende dag med opgaver denne uge).
- Under dagens rute bevares "Denne uge"-oversigten (Mine Opgaver) og vagtoversigten uændret.
- Indlæsning viser skeleton-kort; fejl viser den fælles "Prøv igen"-visning.
- Mobil først: store trykflader (min. 44 × 44 px), én kolonne, læsbar på arbejdstelefon i sollys.

## B. PDF-dagseddel til formiddagsmødet

Knap "Print dagsseddel" i ugeplanen på en valgt dag (kun for skadeleder/admin, samme rettighed som "Publicér dag").

- Genererer en A4-PDF i browseren (pdf-lib, indlæses kun ved klik) med dagens opgaver for den aktive afdeling/underafdeling.
- Gruppering pr. bil/hold, så hvert hold kan rive sin side af; opgaver uden bil samles under "Uden bil".
- Pr. opgave: tid, sagsnummer/titel, adresse, medarbejdere, ansvarlig, lagerinfo og evt. kort bemærkning.
- Sidehoved: afdeling/underafdeling, dato og ugedag. Sidefod: udskriftstidspunkt og sidetal.
- Kun publicerede + kladder markeres tydeligt, så man kan se hvad der endnu ikke er meldt ud.
- Filnavn: `dagsseddel-YYYY-MM-DD.pdf`.

## Teknisk

- Ny komponent `src/components/Dashboard/MinDag.tsx` plus små underkomponenter; indsættes øverst i `ServicemedarbejderDashboard.tsx`. Datagrundlaget er de opgaver, `useAssignmentDataOptimized` allerede henter — ingen ekstra forespørgsler.
- Telefonnumre læses fra eksisterende `phone` på medarbejderprofilen; ingen nye felter, intet nyt eksponeret ud over navn/telefon på kollegaer på samme opgave.
- Kortnavigation via `https://www.google.com/maps/dir/?api=1&destination=<adresse>` (virker på iOS og Android); adressen sammensættes af location, postnummer og by.
- PDF: ny `src/utils/dayReportPdf.ts` med dynamisk `import('pdf-lib')`, kaldt fra en ny knap i dagsoverskriften i ugeplanen (Standard og Kompakt).
- Farver via semantiske tokens i `src/index.css`; ingen faste farveklasser. Tekster gennem oversættelseslaget (DA/EN).
- Statistikkortene på servicemedarbejderforsiden ("I dag"/"Denne uge") får samme tokens i stedet for de nuværende faste blå/grønne farver.
- Verifikation: typetjek, kodetjek, visuel kontrol i mobilbredde og desktop, PDF åbnes og gennemses side for side. CHANGELOG.md og docs/implementation-plan/tasks.md opdateres.
