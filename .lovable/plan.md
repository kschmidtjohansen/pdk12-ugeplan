Planen er at fjerne selve årsagen til overlap i stedet for at justere z-index igen.

1. Erstat den ekstra `AlertDialog` i `MultipleCarSelector` med en konflikt-visning inde i bilvælgerens egen Popover/Drawer.
   - Når en optaget bil vælges, skifter listen til en kompakt bekræftelsesvisning i samme panel.
   - Knapperne `Annuller` og `Brug alligevel` bliver sticky/nederst i samme panel og kan derfor ikke ligge bag listen.

2. Hold desktop og mobil adfærd adskilt, men med samme konflikt-state.
   - Desktop: Popover bliver åben og viser konfliktbekræftelsen i stedet for bil-listen.
   - Mobil: Drawer viser samme bekræftelse med synlige touch-venlige knapper.

3. Fjern den ustabile portal-kombination.
   - Drop `AlertDialog` import og dialog-state i denne komponent.
   - Brug kun én overlay/portal ad gangen: enten Popover eller Drawer.
   - Bevar eksisterende funktionalitet: `Brug alligevel` kalder fortsat `onCarToggle(carId)`, og `Annuller` vender tilbage til bil-listen.

4. Opdater dokumentation.
   - Opdater `CHANGELOG.md` med den endelige løsning.
   - Opdater `/docs/implementation-plan/tasks.md` så den tidligere rettelse beskrives som erstattet af den robuste inline-konfliktløsning.

Teknisk set flyttes konflikt-UI'et fra en sekundær Radix `AlertDialog` til samme render-flow som bilvælgeren, så listen aldrig kan skære ind over bekræftelsesknapperne.