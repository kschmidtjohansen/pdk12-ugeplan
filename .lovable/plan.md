# Biloversigt på kioskvisning (/screen-display)

Tilføjer en pæn liste nederst på kioskskærmen, der viser hvilke medarbejdere der er koblet på hvilke biler for den valgte dag. Den nuværende visning med opgavekort ændres ikke.

## Sådan ser det ud

- Under opgavekortene kommer en ny sektion med overskrift "Biler & bemanding".
- Én række pr. bil der er i brug den dag: bilnavn/-nummer til venstre, tilknyttede medarbejdere til højre som navne-chips.
- Biler uden opgaver den dag vises ikke.
- Er der ingen biler i brug, vises sektionen slet ikke.
- Samme kortstil, tætte spacing og semantiske farver som resten af kiosksiden; læsbar på afstand.

## Sådan bygges det

Ny komponent `src/components/ScreenDisplay/ScreenDisplayCarList.tsx`:
- Modtager `assignments: Assignment[]` (data hentes allerede af `useScreenDisplayData`, ingen nye kald eller RPC'er).
- Bygger et map fra bilnavn → sæt af medarbejdernavne ved at gennemløbe `assignment.cars` (string-liste) og `assignment.assignedEmployees`.
- Dedupliker medarbejdere pr. bil; sortér biler alfabetisk/numerisk og medarbejdere alfabetisk.
- Biler uden medarbejdere vises med en dæmpet tekst "Ingen bemanding".

Ændringer i eksisterende filer:
- `src/pages/ScreenDisplayPage.tsx`: render `<ScreenDisplayCarList assignments={assignments} />` efter `<ScreenDisplayContent />`.
- `src/translations/da/screenDisplay.ts` og `src/translations/en/screenDisplay.ts`: nye nøgler `carsAndCrew` og `noCrew`.

Ingen database- eller RLS-ændringer. Rotation, realtime-opdatering og dagsskifte virker uændret, da listen bruger samme datasæt.

## Dokumentation

`CHANGELOG.md` opdateres med ændringen.
