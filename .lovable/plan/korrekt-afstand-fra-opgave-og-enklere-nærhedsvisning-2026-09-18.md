# Korrekt afstand fra opgave og enklere nærhedsvisning

## Resultat

- En medarbejder med opgaver på dagen måles fra dagens seneste opgave til det søgte postnummer.
- Hjemadressen bruges kun på dage, hvor medarbejderen ikke har nogen opgave.
- Den blå markering til højre er det eneste sted, der viser kilometer og estimeret køretid.
- De grønne og gule dagsmærker viser fortsat ugedag og ledig tid, men ikke afstand eller køretid.

## Implementering

1. **Få opgavekoordinater med helt frem til nærhedssøgningen**
   - Udvid den eksisterende sikre ugeplansfunktion, så den returnerer opgavens `lat` og `lng` sammen med de øvrige opgavefelter.
   - Bevar den nuværende afdelings- og underafdelingsisolering samt funktionens eksisterende adgangskontrol.
   - Opdater de tilhørende datatyper og konverteringer, så koordinaterne ikke længere mistes mellem databasen og Ugeplanen.

2. **Brug opgaven som førstevalg**
   - Sortér dagens opgaver efter sluttid og brug koordinaterne fra den seneste opgave som udgangspunkt.
   - Brug kun medarbejderens hjemmekoordinater, når dagens opgaveliste er tom.
   - Hvis en eksisterende opgave mangler koordinater, vises den som manglende afstand i stedet for fejlagtigt at blive beregnet fra hjemmet.
   - Den blå markering og den samlede rangering baseres på den bedste relevante hverdag med mindst én times ledig tid, som hidtil.

3. **Forenkle dagsmærkerne**
   - Fjern kilometer og estimeret køretid fra alle grønne/gule dagsmærker.
   - Bevar tekster som “Fri hele dagen (8 t)”, “Fri fra 13:00 · 5 t”, “Optaget” og “Fraværende”.
   - Bevar kilden under medarbejderens navn som “Fra sidste opgave” eller “Fra hjemadresse”, men uden gentagelse af kilometer og køretid.
   - Vis kilometer og “ca.”-køretid kun i den blå markering til højre.

## Kvalitet og dokumentation

- Kontrollér både bookede og ikke-bookede fugtteknikere på hverdage samt visningen på smalle og brede skærme.
- Kør TypeScript-kvalitetstjek og bekræft, at ændringen følger sikkerheds- og UI-retningslinjerne i `/docs`.
- Opdatér `CHANGELOG.md` og markér opgaven som fuldført i `docs/implementation-plan/tasks.md`.
