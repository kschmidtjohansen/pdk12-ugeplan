# Ret nærhedsrangeringen i Ugeplanen

## Bekræftet problem
- Mark Frisbæk er koblet på opgaver i **2765 Smørum i dag**, senest til kl. 13:00.
- Simon Andersen har ingen opgave i dag, så hans hjemadresse er kun en gyldig reservekilde.
- Adresseopslaget for Marks Smørum-opgave returnerer gyldige koordinater.
- Nærhedspanelets hovedrangering sammenfatter i øjeblikket hele ugen til én afstand. Det kan derfor vise en hjemadresse fra en ubemandet dag i stedet for medarbejderens relevante opgaveposition.

## Ændringer
1. **Gør dagens position styrende**
   - Når den viste uge indeholder dags dato, rangeres medarbejdere ud fra dagens seneste opgave.
   - Har medarbejderen opgaver i dag, må hjemadressen aldrig bruges som afstandskilde for dagens rangering.
   - Kun medarbejdere uden opgaver i dag må rangeres fra hjemadressen.

2. **Bevar ugevisningen uden at blande kilder**
   - Dagsmærkerne viser fortsat ledighed og fravær mandag–fredag.
   - For en uge, der ikke indeholder dags dato, vælges den relevante opgavedag deterministisk; hjemadresse bruges kun, hvis medarbejderen slet ikke har en opgave i den viste uge.
   - Ved flere opgaver samme dag vælges den senest afsluttende opgave deterministisk.

3. **Sikr korrekt sortering og visning**
   - Afstandskilden og den blå afstandsmarkering skal altid beskrive den samme dag og position.
   - Afstand afgør, hvem der vises som nærmest; tilstrækkelig ledig tid fremhæves fortsat tydeligt uden at kunne gøre en fjernere hjemadresse til “nærmest”.

4. **Regressionstest**
   - Tilføj test med Mark-scenariet: medarbejder A har dagens opgave i det søgte postnummer, medarbejder B er ubemandet med en nærliggende hjemadresse; medarbejder A skal stå først og have opgaven som kilde.
   - Test også hjemadresse-fallback, manglende adressekoordinater og flere opgaver samme dag.

5. **Dokumentation og kontrol**
   - Opdater implementeringsplanen og changeloggen.
   - Kontrollér TypeScript, relevante tests samt at ændringen følger afdelingsisolering, sikkerhedskrav og UI-retningslinjer.

## Tekniske detaljer
- Fokus er `useProximitySearch` og den viste afstandskilde i `ProximityPanel`; ingen databaseændring forventes.
- Eksisterende afdelings- og underafdelingsfiltrering bevares uændret.
