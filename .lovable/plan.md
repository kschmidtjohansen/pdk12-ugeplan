Planen er at rette problemet ved at fjerne race condition mellem bilvælgerens popover/drawer og konflikt-dialogen.

1. **Gør åbningen sekventiel i stedet for samtidig**
   - Når en bil-konflikt vælges, skal bil-listen først lukkes helt.
   - Konflikt-data gemmes midlertidigt som “pending”.
   - Først i næste render-frame åbnes dialogen “Bil allerede i brug”.
   - Det forhindrer at Radix Popover-portalen stadig ligger ovenpå dialogen.

2. **Afmonter bilvælgerens portal mens konflikt-dialogen er aktiv**
   - Popover/Drawer-content skal ikke bare være `open=false`; den skal slet ikke renderes når der er en aktiv eller pending konflikt.
   - Det sikrer at listen ikke kan blive hængende visuelt bag/foran dialogen.

3. **Bevar eksisterende funktionalitet**
   - “Brug alligevel” skal stadig tilføje bilen.
   - “Annuller” skal lukke dialogen og lade brugeren åbne bil-listen igen.
   - Desktop bruger fortsat Popover, mobil bruger fortsat Drawer.

4. **Dokumentation og kvalitetstjek**
   - Opdatér `CHANGELOG.md` med den endelige overlap-fix.
   - Opdatér `/docs/implementation-plan/tasks.md` som fuldført.
   - Kontrollér at ændringen kun påvirker UI-lagdeling og ikke ændrer booking-/konfliktlogikken.