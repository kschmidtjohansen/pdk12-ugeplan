# Seneste opgaveadresse som udgangspunkt

## Resultat
- En booket medarbejder måles fra adressen på dagens senest afsluttende opgave til det søgte postnummer.
- Hjemadressen bruges kun på dage, hvor medarbejderen ikke er koblet på nogen opgave.
- Eksisterende opgaver virker også, selv om de blev oprettet før positionsfelterne blev gemt.

## Bekræftet årsag
- Nærhedsberegningen prioriterer allerede opgaver over hjemadressen.
- I den kontrollerede uge har alle 218 bookede opgaver tomme positionsfelter, selv om opgaverne har en adresse. Derfor kan panelet ikke beregne opgaveafstanden og ender uden et brugbart opgavepunkt.

## Implementering
1. **Find positionen for eksisterende opgaveadresser**
   - Udvid den eksisterende DAWA-forbindelse med opslag af en fuld opgaveadresse.
   - Slå kun den relevante seneste opgave pr. medarbejder og dag op, når dens gemte position mangler.
   - Genbrug opslag for identiske adresser og cache resultaterne, så panelet ikke sender unødvendige kald.

2. **Gør opgavekilden entydig**
   - Sortér dagens koblede opgaver efter sluttid og brug den sidste opgaves gemte eller opslåede position.
   - Hvis den sidste opgave ikke kan positionsbestemmes, vises manglende afstand; der må ikke skiftes til hjemadresse på en booket dag.
   - Brug kun hjemadressen, når medarbejderen har nul opgaver den pågældende dag.

3. **Bevar den ønskede visning**
   - Den blå markering til højre viser afstand og estimeret køretid fra det valgte udgangspunkt.
   - Teksten under navnet viser “Fra sidste opgave” for bookede dage og “Fra hjemadresse” for helt ledige dage.
   - Grønne og gule dagsmærker forbliver uden kilometer og køretid.

## Teknisk kvalitet
- Afdelings- og underafdelingsfiltrering ændres ikke.
- Tilføj målrettede tests for seneste opgave, manglende opgaveposition og hjemadresse-fallback.
- Kontrollér en booket og en ikke-booket fugttekniker i nærhedspanelet samt smal og bred visning.
- Kør projektets kvalitetstjek og opdatér `CHANGELOG.md` samt `docs/implementation-plan/tasks.md`.
