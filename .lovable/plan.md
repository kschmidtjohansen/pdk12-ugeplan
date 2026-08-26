# Slet vagter direkte i kalendervisningen

I dag kan vagter kun slettes i listevisningen. I kalendervisningen åbner et klik kun redigeringsdialogen (desktop) eller en info-popover (mobil), og der findes ingen sletteknap. Planen tilføjer sletning både for enkelte vagter og for flere ad gangen.

## Det brugeren får

1. **Slet én vagt direkte i kalenderen**
   - Desktop: et lille skraldespands-ikon vises på vagt-chippen ved hover (kun for brugere med rettigheder). Klik åbner en bekræftelsesdialog.
   - Mobil: popover'en får en "Fjern vagt"-knap med samme bekræftelse.

2. **Slet flere vagter ad gangen**
   - Ny knap "Vælg flere" i kalenderens topbar (kun for administratorer/skadeledere).
   - I markeringstilstand får hver vagt-chip et afkrydsningsfelt i stedet for at åbne redigering.
   - En handlingslinje viser "X vagter valgt" med knapperne "Slet valgte" og "Annullér". Sletning kræver bekræftelse og viser en samlet kvittering.

3. **Slet fra redigeringsdialogen**
   - `DutyEditDialog` får en "Fjern vagt"-knap nederst til venstre, så man kan slette den vagt man netop har åbnet.

4. Efter sletning opdateres kalenderen automatisk (samme refetch som i listevisningen).

## Teknisk

- `src/hooks/duty/useDutyActions.ts`: tilføj `removeDuties(ids: string[])` der sletter med `.in('id', ids)`, viser én toast og invaliderer `['duties']`. `removeDuty` bevares uændret.
- `src/components/Duty/DutyMonthCalendar.tsx`:
  - Ny lokal state `selectionMode` og `selectedIds: Set<string>`.
  - Vagt-chip: hover-trash (desktop), checkbox i markeringstilstand, "Fjern vagt" i mobil-popover.
  - `AlertDialog` til bekræftelse for både enkelt- og bulk-sletning.
  - Kalder `useDutyActions(onSuccess)` — samme mønster som `DutyList`.
  - Alt sletnings-UI er gated på `canManage`.
- `src/components/Duty/DutyEditDialog.tsx`: "Fjern vagt"-knap i footer (destructive, venstrestillet) med bekræftelse, lukker dialogen og kalder `onSuccess`.
- Oversættelser i `src/translations/da/duty.ts` og `en/duty.ts`: `selectMultiple`, `cancelSelection`, `deleteSelected`, `selectedCount`, `confirmRemoveMultiple`, `confirmRemoveMultipleMessage`, `removeMultipleSuccess`.
- Ingen ændringer i database eller RLS — eksisterende slette-politik på `on_call_duties` bruges.
- `CHANGELOG.md` opdateres efter implementering.
