# Fejl ved "Lav notifikation"

## Hvad fejlen betyder

Beskeden "Failed to send a request to the Edge Function" betyder, at browseren
slet ikke fik et svar tilbage fra den service, der skriver notifikationen.
Det er ikke en afvisning — forbindelsen falder på gulvet undervejs.

## Hvad jeg har tjekket

- Servicen er udrullet og svarer normalt på kald (den afviser korrekt kald uden login).
- Browserens sikkerhedstjek (CORS) går igennem uden problemer.
- Sprogmodellen har kun modtaget ét kald i dag — mit eget test kl. 10:52 — så
  dit forsøg nåede aldrig frem til modellen.

Det peger på, at servicen stopper undervejs, netop når den skal skrive teksten.
Selve tekstgenereringen bruger i dag et tungt streaming-bibliotek med
"reasoning"-tilstand, som er den mest sandsynlige årsag til, at arbejdsprocessen
løber tør for tid eller hukommelse og lukker uden svar. Diagnosen er ikke
endeligt bekræftet, så planen begynder med at gøre fejlen synlig.

## Sådan løser jeg det

1. **Forenkl tekstgenereringen.** Kaldet til sprogmodellen laves som et enkelt,
   direkte kald uden streaming og uden det tunge bibliotek. Samme model, samme
   resultat — men markant lettere for servicen at gennemføre.
2. **Ingen tavse nedbrud.** Al fejlhåndtering pakkes ind, så servicen altid
   svarer med en forklaring i stedet for at lukke forbindelsen.
3. **Forståelige fejlbeskeder i skærmbilledet.** I stedet for den tekniske
   sætning vises fx "Der er ikke flere AI-kreditter" eller "For mange
   forespørgsler — prøv igen om lidt", og ellers den præcise årsag.
4. **Logning undervejs**, så et eventuelt fremtidigt problem kan aflæses direkte
   i servicens log.
5. **Test efter udrulning:** Jeg kalder servicen direkte og bekræfter, at der
   kommer en titel og en besked retur, og at sprogmodellen registrerer kaldet.

Udsendelsen af selve beskederne og den nye leveringsstatus røres ikke.

## Teknisk

- `supabase/functions/broadcast-notification/index.ts`: fjerner
  `npm:@ai-sdk/openai` og `npm:ai`; `generateNotification()` laver i stedet en
  enkelt `fetch` til `https://ai.gateway.lovable.dev/v1/chat/completions`
  (model `google/gemini-3-flash`, ikke-streaming, `LOVABLE_API_KEY` som Bearer),
  med `AbortSignal.timeout` og eksplicit håndtering af 429/402.
  Parsningen af `TITEL:` / `BESKED:` bevares uændret.
- Fejl returneres altid som JSON med CORS-headere og en `error`-kode.
- `src/components/Admin/BroadcastNotification.tsx`: oversætter fejlkoderne
  (`rate_limited`, `payment_required`, `missing_api_key`, `empty_result`) til
  danske/engelske tekster i `translations/*/admin.ts`.
- Verifikation: `supabase--curl_edge_functions` mod `generate`-tilstanden plus
  opslag i AI Gateway-loggen.
