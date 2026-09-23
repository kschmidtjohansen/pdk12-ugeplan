# Vikar kan bookes efter sin udløbsdato

## Problemet

I medarbejdervælgeren i ugeplanen sammenlignes vikarens udløbsdato med **dagens dato** i stedet for med den dato, opgaven ligger på. En vikar, der udløber i denne uge, fremstår derfor stadig ledig, når man opretter en opgave i næste uge — og kan vælges til den.

Bekræftet i `src/components/Planner/EmployeeSelector.tsx`: udløb beregnes tre steder som `new Date(emp.expires_at) < new Date()` (linje 131, 182-184 og 369-371), altså altid mod nutidspunktet.

## Løsningen

Udløb skal vurderes mod **opgavens dato**:

- Vælger man en opgave på en dato efter vikarens udløb, er vikaren låst og kan ikke vælges.
- Låseforklaringen ved hold-over er den eksisterende: "Midlertidig adgang er udløbet".
- Ved flerdages-opgaver markeres vikaren som delvist tilgængelig, hvis kun nogle af dagene ligger efter udløbet, og helt utilgængelig hvis alle dage gør.
- Udløbsdagen selv tæller stadig med som en gyldig arbejdsdag (vikaren kan bookes til og med sin udløbsdato).
- Er en vikar allerede valgt til en opgave, kan man som hidtil altid fjerne ham igen.

## Teknisk

Alt sker i `src/components/Planner/EmployeeSelector.tsx`, kun præsentation/valg-logik — ingen ændringer i data, RLS eller rettigheder:

1. Ny lille hjælper i filen, fx `isExpiredOn(emp, date)`, der sammenligner `expires_at` (dagens slutning) med den givne dato i stedet for `new Date()`.
2. `disabledIdSet` (linje 175-204) bruger `dateForComparison` i stedet for nutid; `dateForComparison` tilføjes til afhængighederne.
3. `multiDateAvailability` (linje 114-153) vurderer udløb pr. dato i `allSelectedDates`, så delvis/ingen tilgængelighed bliver korrekt.
4. Visningen i `renderEmployeeButton` (linje 369-371) bruger samme hjælper, så badge og låseforklaring matcher.

Verifikation: typetjek og kodetjek, samt kontrol i ugeplanen af en opgave før, på og efter en vikars udløbsdato. `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres til sidst.
