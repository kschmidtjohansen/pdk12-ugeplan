## Mål
Sørg for at dialog-indhold scroller korrekt, mens både `DialogHeader` og `DialogFooter` forbliver synlige (sticky) i toppen/bunden — på mobile og desktop. Memory'en kræver allerede "fixed headers", men i praksis scroller både header og footer sammen med indholdet i dag.

## Nuværende tilstand (`src/components/ui/dialog.tsx`)
- `DialogContent` har én indre wrapper med `overflow-y-auto max-h-[90vh] p-6 pr-8` der scroller alt — inkl. header og footer.
- `DialogHeader`/`DialogFooter` har bare `relative z-10 pb-4 / pt-4`, ingen sticky.

Resultat: lange formularer (CarFormDialog, EmployeeFormDialog, VacationFormDialog, UserFormDialog, DutyEditDialog osv.) skubber footer-knapperne ud af viewport, og brugeren skal scrolle hele dialogen ned for at trykke "Gem".

## Løsning (zero-touch for consumers)
Modificér kun `src/components/ui/dialog.tsx`. Ingen ændringer i de ~25 dialog-callers, fordi alle bruger `DialogHeader` + `DialogFooter`-komponenterne.

### Ændringer i `dialog.tsx`

1. **`DialogContent` indre scroll-wrapper:** Behold `overflow-y-auto overscroll-contain max-h-[90vh]`, men flyt padding fra wrapperen ud, så sticky header/footer kan dække wrapperens fulde bredde uden hak. Konkret: skift `p-6 pr-8` → `px-0 py-0` på wrapperen, og lad i stedet `DialogHeader`/`DialogFooter` samt et nyt inline-padding-mønster styre afstandene. (Alternativt: behold padding og brug `-mx-6 -mt-6` / `-mx-6 -mb-6` på header/footer for at strække dem til kanten — mindre invasivt, foretrækker dette.)

   Valgt approach: **behold `p-6 pr-8`** på scroll-wrapperen og lad header/footer bryde ud via negative margins. Det undgår at brydee alle dialoger der har `space-y-4` direkte under header.

2. **`DialogHeader`** — sticky top:
   ```
   "sticky top-0 z-20 -mx-6 -mt-6 px-6 pt-6 pb-3 mb-4
    bg-background border-b border-border
    flex flex-col space-y-1.5 text-left"
   ```
   - `-mx-6 -mt-6 px-6 pt-6` neutraliserer wrapperens padding så baggrunden strækker sig kant-til-kant og dækker indhold der scroller under.
   - `pr-12` overvejes for at give plads til Close-knappen (X i øverste højre hjørne) — tilføjes så title-tekst ikke løber ind under X'et.

3. **`DialogFooter`** — sticky bottom:
   ```
   "sticky bottom-0 z-20 -mx-6 -mb-6 px-6 pt-3 pb-6 mt-4
    bg-background border-t border-border
    flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2
    space-y-2 space-y-reverse sm:space-y-0"
   ```

4. **Mobile sikkerhed:**
   - Tilføj `pb-[max(1.5rem,env(safe-area-inset-bottom))]` på footer for at respektere iOS home indicator.
   - Behold `max-h-[90vh]` — fungerer på begge form factors.

5. **Close-knap (X):** Allerede `absolute right-3 top-3 z-[60]` — ligger uden for scroll-wrapperen, så den forbliver synlig. Ingen ændring nødvendig, men header får `pr-12` så titel ikke kolliderer.

### Verifikation
Stikprøve QA i preview på følgende dialoger (kendte lange formularer):
- `CarFormDialog`, `EmployeeFormDialog`, `VacationFormDialog`, `UserFormDialog`, `DutyEditDialog`, `WarehouseFormDialog`, `Admin/PasswordChangeDialog`.

Tjek på både mobile (375px) og desktop (1280px): scroll indeni → header bliver, footer bliver, ingen visuelle hak ved kanter, Close-X ikke skjult.

### CHANGELOG + tasks.md
- Tilføj entry under nyeste sektion i `CHANGELOG.md`: "Sticky `DialogHeader` og `DialogFooter` — submit/cancel-knapper og titel forbliver synlige under scroll i lange dialoger."
- Opdater `docs/implementation-plan/tasks.md` hvis relateret opgave findes.

## Risici
- Dialoger der bruger custom inner padding kan se en lille off-by-1 ud ved sticky-borderen — mitigeret af `bg-background` der dækker.
- Dialoger uden `DialogFooter` (kun bekræftelses-dialoger uden form, fx `DeleteConfirmDialog`) påvirkes ikke, fordi sticky-styling kun aktiveres når komponenten faktisk bruges.
