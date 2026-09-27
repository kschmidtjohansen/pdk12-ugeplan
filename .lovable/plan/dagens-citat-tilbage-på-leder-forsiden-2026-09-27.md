# Dagens citat tilbage på leder-forsiden

## Baggrund
Det daglige motiverende citat (fra `src/utils/dailyQuotes.ts`) forsvandt for skadeledere og administratorer, da WelcomeHeader blev erstattet af den nye CommandBar. Servicemedarbejdere ser det stadig via WelcomeHeader — det er kun ledernes forside, der mangler det.

## Ændring
Én fil: `src/components/Dashboard/CommandBar.tsx`

- Importér `getDailyQuote` fra `@/utils/dailyQuotes`.
- Vis dagens citat som en diskret, kursiv linje (`text-xs italic text-muted-foreground/80`) direkte under dato-linjen i hilsen-blokken — så det føles som en naturlig del af den slanke bjælke og ikke som den gamle store boks.
- På mobil afkortes citatet til én linje med ellipsis (`truncate`), på større skærme må det gerne fylde to linjer (`hidden sm:line-clamp-2`-mønster), så bjælken ikke bliver for høj på telefonen.

## Design
- Følger eksisterende semantiske tokens (`text-muted-foreground`), ingen nye farver.
- Ingen ændring for servicemedarbejdere — deres WelcomeHeader er uændret.

## Verificering
- Typecheck.
- CHANGELOG.md opdateres med ændringen.
