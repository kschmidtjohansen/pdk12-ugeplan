## Flyt ugenavigationen ned i "Ugens plan"

Den markerede ugevælger (`‹ Uge 39 ›` + "Denne uge") flyttes fra toppen af Ugeplan ned i højre side af "Ugens plan · Uge 39"-linjen, på samme række som overskriften.

```text
Ugens plan · Uge 39                [‹ Uge 39 ›] [Denne uge]
[32 Opgaver] [0 Kladder] [5 Uden medarb.] [2 Overlap]
```

- Toppen beholder titel, "Ny Opgave", visningsknapper og skærm-knappen (skærmknappen rykker op ved visningsknapperne).
- Infoteksten om medarbejdertilknytning flyttes ind under overskriften, så der er plads til navigationen.
- Prefetch ved hover på pilene og alle handlinger virker som før. Mobil: navigationen ombrydes under overskriften.

### Teknisk
- `PlannerHeader.tsx`: fjern ugenavigation + "Denne uge"; behold Monitor-knap.
- `WeekOperationsStrip.tsx`: ny valgfri prop `navigation?: ReactNode` renderet til højre i header-rækken.
- `PlannerPage.tsx`: send navigationen (samme handlers) til `WeekOperationsStrip`; ubrugte props fjernes fra `PlannerHeader`.
- CHANGELOG opdateres. Ingen data-/backend-ændringer, ingen publicering.
