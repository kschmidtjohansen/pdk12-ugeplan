# Bil på to opgaver med samme hold er ikke en konflikt

## Problem
I dag bliver en bil markeret som konflikt, så snart den står på to opgaver samme dag på samme tid. Der bliver ikke set på, hvem der kører i den. Hvis det er det samme hold, der kører fra den ene opgave til den næste, er det ikke dobbeltbooking.

## Regel
En bil tæller **ikke** som konflikt mellem to opgaver, hvis holdet er det samme. Det vil sige:
- de samme medarbejdere står på begge opgaver, eller
- holdet på den ene opgave er en del af holdet på den anden (fx Jens + Ole på den ene opgave og Jens på den anden).

Det tæller stadig som konflikt, hvis:
- holdene er forskellige eller kun overlapper delvist (fx Jens + Ole og Jens + Peter),
- en af opgaverne ikke har nogen medarbejdere på.

Konflikter for medarbejdere virker som i dag. Hvis samme medarbejder står på to opgaver på samme tid, vises det stadig.

## Hvor det ændres
1. **Konflikt-mærket i ugeplanen**: konfliktmærket og konfliktlisten på opgavekortene.
2. **Bilvælgeren i "Opret/Rediger opgave"**: en bil vises som ledig (grøn) og kan vælges uden advarsel, hvis den kun er booket af opgaver med samme hold som det, der er valgt i formularen. Hvis holdet ændres, beregnes bilens status igen.

## Tekniske detaljer
- `src/utils/assignmentConflicts.ts`: tilføj `sameCrew(aEmps, bEmps)`, der er sand når begge er ikke-tomme og den ene mængde er en delmængde af den anden. Spring bil-konflikten over, når den er sand.
- `src/components/Planner/MultipleCarSelector.tsx`: ny valgfri prop `selectedEmployeeIds`. `isCarBookedOnDate` og listen over konfliktende opgaver ignorerer opgaver med samme hold, beregnet med den samme hjælpefunktion (eksporteres fra assignmentConflicts).
- Send de valgte medarbejdere videre fra opgaveformularen til `MultipleCarSelector`.
- Ingen ændringer i databasen. CHANGELOG og tasks.md opdateres.
