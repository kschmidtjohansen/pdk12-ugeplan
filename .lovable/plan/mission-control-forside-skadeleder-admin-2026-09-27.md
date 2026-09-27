# Mission Control-forside (skadeleder / admin)

Servicemedarbejderens forside (Min Dag) forbliver uændret.

## Hvad brugeren ser

```text
+--------------------------------------------------------------------+
| God morgen, Kasper · søndag 27. sep      [ Søg sag, adresse, ... ] |
| (Vagt: Anni 12345678) (8/11 aktive) (5/7 biler) (2 vikarer udløber)|
+--------------------------------------------------------------------+
| [Beredskabsbjælke – kun ved vejrvarsel]                            |
|  [ I dag ] [ Ugens overblik ]                  |  Nøgletal         |
|  07 ---o Sag 1234  Ribevej 3   Anni, Bo        |  Fremmøde / syge  |
|  09 ---(•) I gang nu: Sag 1240 ...  (pulserer) |  Ferier kommende  |
|  12 ---o ...                                   |  Genveje (dock)   |
+--------------------------------------------------------------------+
```

1. **Command Bar**: erstatter velkomstboksen og de spredte statusfelter med én bjælke. Hilsen og dato til venstre, søgefelt og 4 piller.
   - Søgefelt: finder sager (nr., titel, adresse), kolleger og biler. Resultaterne vises i en liste mens man skriver, og et klik åbner sagen eller personen/bilen. Tastaturgenvej `/`.
   - **Vagt**: dagens vagt med navn. Klik åbner en lille boks med telefonnummer og "Ring"-knap.
   - **Aktive (8/11)**: klik åbner den eksisterende liste over ledige medarbejdere.
   - **Biler (5/7)**: klik åbner den eksisterende liste over ledige biler.
   - **Vikarer udløber**: vises kun når der er nogen, klik åbner den eksisterende forlæng-boks.
2. **Faner [ I dag ] / [ Ugens overblik ]**: "I dag" er valgt fra start. "Ugens overblik" viser den nuværende ugeliste med ugeskifter. Det sidste valg huskes.
3. **Tidslinje for I dag**: dagens sager sorteres efter tid på en lodret linje. Hver sag viser tid, sagsnummer, adresse, medarbejdere og bil. Sagen der er i gang har en pulserende prik, afsluttede sager er nedtonede, og en "Nu"-markør flytter sig hvert minut. Et klik åbner sagen som i dag.
4. **Højre kolonne**: slankere nøgletal (fremmøde, syge/kursus, ferier), kommende ferier og genveje som en kompakt dock. Genvejsgitteret flyttes hertil fra toppen.
5. **Stil**: kort med `bg-card/70`, let blur og tynde `border-border/60`, ingen rammer inden i rammer. Signaturfarven bruges kun til aktiv fane, pille og "i gang nu". Der tilføjes ingen gradients eller glow. På mobil ligger pillerne i en række man kan scrolle vandret, og søgefeltet står i fuld bredde under hilsenen.

## Tekniske detaljer

- Nye filer: `Dashboard/CommandBar.tsx`, `Dashboard/StatusPill.tsx`, `Dashboard/GlobalSearch.tsx` (cmdk `Command` i Popover på desktop og Drawer på mobil), `Dashboard/TodayTimeline.tsx`.
- `DashboardCockpit.tsx`: shadcn `Tabs` med værdi i localStorage (`dashboardTab`). `WeeklyAssignments` genbruges under "Ugens overblik".
- `DashboardPage.tsx`: `WelcomeHeader` fjernes for ikke-servicemedarbejdere og erstattes af `CommandBar`. `ExpiringTempsCard` erstattes af pillen, som åbner samme dialog. Opdater/ryd cache-knapperne flyttes ind i bjælken som ikon-knapper.
- Data genbruges fra `useDashboardMetrics`, `useDutyData`, `useEmployees`, `useCars` og `useAssignments`. Der kommer ingen nye forespørgsler og ingen ændringer i databasen. De eksisterende modaler fra `CompactKpiStack` trækkes ud, så pillerne kan åbne dem.
- Pulsen bruges via `animate-ping` på en `bg-primary`-prik og respekterer `motion-reduce`.
- Alle farver er semantiske tokens. Afdelingsisolation (`selectedDepartmentId`) er uændret.
- Opdater CHANGELOG.md og `docs/implementation-plan/tasks.md`.
