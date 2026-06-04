Planen er at ændre bilkonflikt-flowet tilbage til en rigtig bekræftelsesdialog, men sikre at bil-listen/dropdownen fysisk bliver lukket og unmountet først.

1. Opdater `src/components/Planner/MultipleCarSelector.tsx`
   - Når en optaget bil vælges, gemmes konfliktdata i en separat state.
   - Bilvælgerens `Popover`/`Drawer` lukkes straks med `setOpen(false)`.
   - Først derefter åbnes dialogen “Bil allerede i brug”.
   - `Popover`/`Drawer` får en afledt `pickerOpen = open && !conflictDialog`, så listen ikke kan være åben samtidig med dialogen.
   - Dialogen renderes som sibling uden for `Popover`/`Drawer`, ikke inde i dropdownen.
   - `Brug alligevel` kalder fortsat `onCarToggle(carId)` og lukker dialogen.
   - `Annuller` lukker kun dialogen.

2. Fjern inline-konfliktvisningen
   - Den seneste inline-løsning fjernes, fordi du specifikt ønsker at dialogboksen stadig skal komme.
   - Bil-listen skal kun vise listen, aldrig konfliktbekræftelsen.

3. Gør layoutet robust
   - Dialogen får højere stacking end dropdownen via eksisterende `AlertDialog`-komponentens portal.
   - Dropdownen unmountes ved konflikt, så der ikke kun er tale om z-index, men ingen overlappende liste i DOM’en.
   - Desktop og mobil følger samme princip: vælger lukkes først, dialog åbnes bagefter.

4. Dokumentation
   - Opdater `CHANGELOG.md` med den endelige løsning.
   - Opdater `/docs/implementation-plan/tasks.md`, så den tidligere inline-løsning erstattes af den nye “luk picker før dialog”-løsning.

Resultat: Dialogen “Bil allerede i brug” vises stadig, men listen/dropdownen er lukket før dialogen vises og kan derfor ikke skære ind over dialogboksen eller skjule “Brug alligevel”. 