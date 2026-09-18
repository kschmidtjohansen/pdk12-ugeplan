# Mark vises uden adresse i postnummersøgningen

## Hvad der er galt

Mark Frisbæk har tre opgaver i dag. To af dem slutter på præcis samme tidspunkt (kl. 13:00):

- Æblevangen 26, 2765 Smørum
- Æblevangen 126, 2765 Smørum

Ingen af dagens opgaver har gemte positioner, så adressen skal slås op hos adresseregistret. Opslaget virker fint for "Æblevangen 126, 2765 Smørum" (bekræftet direkte mod adresseregistret).

Fejlen er, at nærhedsvisningen to steder vælger "dagens sidste opgave" på hver sin måde:

- Listen over adresser, der skal slås op, vælger ved tidsuafgjort den opgave, der tilfældigvis kom først i data.
- Selve beregningen vælger ved tidsuafgjort efter opgavens id.

Ved to opgaver med samme sluttid peger de to valg på hver sin opgave. Så bliver den forkerte adresse slået op, den valgte opgave har ingen position, og Mark havner nederst med "ingen koordinater" i stedet for at ligge øverst i 2765.

## Løsning

1. Lad begge steder bruge præcis den samme udvælgelse af dagens sidste opgave, så adressen der slås op altid er den adresse beregningen bruger.
2. Slå adresser op for alle dagens opgaver for de viste medarbejdere, ikke kun den ene udvalgte. Så holder visningen også, hvis der senere kommer flere uafgjorte sluttider.
3. Hvis dagens sidste opgaveadresse mod forventning ikke kan findes, bruges den nærmest foregående opgaveadresse samme dag, før der gives op. Hjemadressen bruges fortsat kun på dage helt uden opgaver.

## Teknisk

- `src/hooks/useProximitySearch.ts`: `missingLastAssignmentAddresses` genbruger `selectLastAssignment` fra `src/utils/proximityRanking.ts` og samler adresser for hele dagens opgavesæt pr. medarbejder/dag.
- Dagsberegningen falder tilbage til den næstsidste opgave med brugbare koordinater samme dag, før `origin` sættes til `null`.
- Ingen databaseændringer; ingen ændringer i edge function `dawa-proxy` (adresseruten er verificeret og returnerer korrekte koordinater).
- Efterfølgende: opdatering af `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.
