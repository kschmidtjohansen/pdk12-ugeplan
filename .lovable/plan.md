## Ændringer i Ferieoversigt

### 1. Omdøb "Ferieoversigt" → "Oversigt"

Erstat label i:
- `src/components/Vacation/VacationGridOverview.tsx` (CardTitle, linje 341)
- `src/translations/da/vacation.ts` (`calendar: "Ferieoversigt"`)
- `src/translations/da/admin.ts` (`vacationCalendar` og `title`)
- `src/components/Layout/NavComponents/VacationOverviewDropdown.tsx` (fallback aria-label/title)
- Tilsvarende engelske strenge i `src/translations/en/...` opdateres til "Overview"

### 2. Ugevisning i bunden med tællere

Tilføj nederst i `VacationGridOverview.tsx` (under filterrækken) en ny boks der viser status for **én valgt uge ad gangen**:

```text
[‹] Uge 26 · 22.–28. jun 2026 [›]   [I dag]
   • Ferie: 3   • Kursus: 1   • Fravær: 0   • Skadelederv.: 2   • Kørevagt: 1
```

- State: `weekAnchor: Date` (initialiseres til mandagen i indeværende uge via `startOfWeek(today, { weekStartsOn: 1 })`).
- `‹` / `›` skifter en uge ad gangen (`addDays(weekAnchor, ±7)`); knappen "I dag" hopper tilbage til indeværende uge.
- Tællere beregnes som **antal unikke medarbejdere** der har den givne kategori i mindst én dag af ugen — uafhængigt af det øvrige `fromDate`/`toDate`-range, så brugeren kan skifte ugevis uden at ændre selve grid-perioden.
- Hver tæller får farveprik der matcher kategoriens farve (sort/gul/rød/blå/grøn) og et lille ikon/label.
- Data hentes via en separat `useQuery` for ugen (samme tre tabeller: `vacations`, `trainings`, `on_call_duties`), filtreret pr. afdeling og `is_demo`. `leave` tælles fra `regularEmployees` der er på `onLeave`/`on_leave` (uafhængig af dato — som i resten af komponenten).
- Ugen vises altid (uafhængigt af filter-toggles), så det fungerer som et selvstændigt overbliksbånd.

### 3. CHANGELOG

Tilføj entry i `CHANGELOG.md` og opdater `.lovable/plan.md`.

### 4. Periode bag navnet i ugentlig statusbar

I den ugentlige statusbar skal hver medarbejder vises med den periode i ugen, vedkommende er fraværende/på kursus/har vagt:

- Ferie og kursus: datoerne klemmes til ugen (`dd.MM–dd.MM` hvis flere dage, ellers `dd.MM`).
- Skadeledervagt og kørevagt: samles fra `on_call_duties.duty_date` og vises på samme måde.
- Fravær vises uden periode, da det er en status uden datointerval.
- Ingen DB/RLS-ændringer.

### 5. Dokumentation

Opdater `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.

### Tekniske noter

- Ingen DB/RLS ændringer.
- Ingen ændringer til selve grid-rækkerne eller eksisterende fra/til-pickers.
- Følger eksisterende farvetokens (`bg-foreground`, `bg-yellow-400`, osv.) som allerede bruges i komponenten.
