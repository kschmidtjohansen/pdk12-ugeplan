# Lettere app: PDF, cache og oprydning

Sådan ser det ud i dag: PDF-værktøjet hentes allerede kun, når nogen laver en PDF. De tre gamle funktioner til vagtbytte-beskeder i appen bliver ikke brugt mere. Medarbejdere og biler bliver i dag hentet igen efter 5 minutter.

## 1. PDF kun når den bruges
- PDF-værktøjet hentes allerede først, når man trykker "Hent som PDF". Kun ét sted i koden laver PDF'er.
- For at det bliver ved med at være sådan, får kodetjekket en regel, der melder fejl, hvis nogen senere henter PDF-værktøjet direkte i starten af en fil.
- Efter build tjekker vi, at PDF-værktøjet ligger i sin egen fil og ikke i den første indlæsning.

## 2. Længere cache for data der sjældent ændrer sig
- **Medarbejderlister** (medarbejdere, vagtmedarbejdere) og **biler** hentes igen efter 15 minutter i stedet for 5, og gemmes i 30 minutter.
- **Bilers utilgængelighed** går fra 1 til 10 minutter.
- **Opgaver og vagter** forbliver som i dag. De holdes friske af de automatiske opdateringer fra serveren.
- Når en medarbejder eller bil bliver oprettet eller ændret, opdateres listen stadig med det samme, fordi cachen bliver nulstillet ved hver gemning.

## 3. Oprydning i vagtbytte-beskeder
- Vi fjerner de tre ubrugte funktioner til byttetilbud, "vagten er taget" og afslag i beskedkoden for vagter. Systemet sender dem nu selv.
- Vi fjerner forældede kommentarer og variabler i vagthandlingerne, hvis de bliver overflødige.
- **Beholdes:** beskeden, når en vagt tildeles. Den bliver stadig sendt fra appen. Den direkte vagtbytte-funktion på serveren (flyt/byt mellem to vagter) beholdes også, for det er et andet forløb end byttetilbud.

## Teknisk
- `eslint.config.js`: `no-restricted-imports` for `pdf-lib` (kun type-imports tilladt).
- `staleTime: 15*60_000, gcTime: 30*60_000` i `useEmployeeData`, `useDutyEmployees`, `useCarData`. `useCarUnavailability` sættes til 10 min.
- `dutyNotifications.ts`: slet `createDutySwapOfferNotification`, `createDutySwapTakenNotification` og `createDutySwapDeclinedNotification` samt deres export.
- Vi tjekker typer og build og ser efter, at pdf-lib ligger i sin egen chunk. CHANGELOG og docs/technical-specs opdateres med cache-reglen.
