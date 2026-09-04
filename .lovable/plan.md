# Vagtbytte: kollega kan hverken acceptere eller afslå

## Hvad der er galt (bekræftet i databasen)

De fire byttetilbud fra 17.–20. september 2026 ligger korrekt i systemet, sendt til én kollega, og de er stadig åbne. To ting spærrer:

1. **Accept fejler.** Den funktion, der gennemfører byttet, kører med kollegaens egne rettigheder. En servicemedarbejder må ikke selv omskrive en vagt eller lukke et byttetilbud, så handlingen bliver afvist, og kollegaen får blot "Kunne ikke overtage vagten". Den tilsvarende annullér-funktion er sat rigtigt op — det er kun accept-funktionen, der mangler samme opsætning.
2. **Afslå findes slet ikke.** Der er hverken en knap eller en bagvedliggende handling til at afvise et byttetilbud. Modtageren kan kun acceptere eller ignorere.

## Plan

1. **Ret accept af vagtbytte**
   - Giv accept-funktionen samme forhøjede kørselsrettigheder som annullér-funktionen, så den inviterede kollega kan overtage vagten.
   - Alle eksisterende kontroller bevares: kun inviterede kandidater, kun åbne og ikke-udløbne tilbud, og skadeledervagter kun til administrator/skadeleder.

2. **Tilføj "Afslå"**
   - Ny funktion, der lader en inviteret kandidat afvise et tilbud.
   - Er der flere kandidater, fjernes blot afviseren fra listen, så de øvrige stadig kan acceptere. Er afviseren den sidste, markeres tilbuddet som afvist.
   - Afsenderen får en besked om afslaget.

3. **Brugerflade**
   - I "Afventende byttetilbud" tilføjes en "Afslå"-knap ved siden af "Overtag vagten", med bekræftelse og dansk/engelsk tekst.
   - Afviste tilbud forsvinder fra kandidatens liste og vises ikke længere som åbne hos afsenderen.

4. **Kvalitetstjek**
   - Test accept og afslag som servicemedarbejder, kontrollér at vagtplanen opdateres, kør typetjek og opdater `CHANGELOG.md`.

## Tekniske detaljer

- `public.accept_duty_swap` mangler `SECURITY DEFINER` (`cancel_duty_swap` har det). Uden det rammer funktionens `UPDATE` på `on_call_duties` og `duty_swap_requests` RLS-politikkerne, som kun tillader `requested_by` eller admin/skadeleder.
- Ny `public.decline_duty_swap(_request_id uuid)` med `SECURITY DEFINER` og `SET search_path = ''`, som fjerner `auth.uid()` fra `candidate_ids` eller sætter status `declined`.
- Frontend: `useDutyActions.declineSwapRequest`, knap i `PendingSwapOffers.tsx`, nye nøgler i `translations/{da,en}/duty.ts`.
- Berørte tilbud: `3d6a5bf3…`, `0fdfc617…`, `e1f45fa4…`, `a7e03ac3…` (17.–20/9-2026, kørevagt).
