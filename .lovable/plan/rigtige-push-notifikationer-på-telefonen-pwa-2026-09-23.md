# Rigtige push-notifikationer på telefonen (PWA)

## Hvad der sker i dag

Systemet laver kun notifikationer **inde i appen**: klokke-ikonet i toppen og en besked, mens du har siden åben. Der findes ingen push-funktion, så telefonen kan ikke give lyd eller vise en besked, når appen er lukket. Det er derfor du ikke modtager noget.

## Hvad vi bygger

Når der oprettes en notifikation til en bruger — ferieansøgning, godkendelse/afvisning af fri, vagtbytte (anmodning, accept, afslag), sygemelding, beskeder på en sag, vagtpåmindelser — sender systemet automatisk en push-besked til brugerens telefon, også når appen er lukket.

1. **Tilladelse i appen**
   - Ny sektion "Notifikationer" på profilen og en lille prompt første gang efter login: "Få besked på telefonen" med knappen "Slå til".
   - Når brugeren trykker til, spørger telefonen om tilladelse, og enheden registreres. Brugeren kan slå det fra igen samme sted.
   - Der kan tilmeldes flere enheder pr. bruger (telefon + computer).

2. **Selve beskeden**
   - Titel og tekst som i appen i dag, Polygon-ikon, og tryk på beskeden åbner den rigtige side (fx ferieansøgningen eller vagtbyttet).
   - Ens beskeder slås sammen, så man ikke får ti notifikationer for det samme.

3. **Automatisk udsendelse**
   - Udsendelsen hænger på notifikationerne i databasen, ikke på de enkelte sider. Derfor bliver alt, der allerede laver en notifikation i dag, automatisk også til en push — og fremtidige notifikationstyper virker uden ekstra arbejde.
   - Demo-notifikationer sendes ikke ud.

4. **Test og verifikation**
   - Ny testknap i Admin: "Send test-notifikation til mig selv", så du kan bekræfte at det virker på din egen telefon.
   - Admin får desuden et lille overblik: hvor mange enheder der er tilmeldt, og hvornår sidste udsendelse fejlede.

## Vigtigt om telefoner og browsere

- **Android (Edge og Chrome):** virker fuldt ud, både i browseren og som installeret app.
- **iPhone:** Apple tillader kun push i en app, der er **lagt på hjemmeskærmen**. Edge og Chrome på iPhone kan ikke installere appen — der skal bruges Safari → Del → "Føj til hjemmeskærm". Installationsvejledningen opdateres med dette, og appen viser selv en venlig besked til iPhone-brugere, der prøver fra Edge/Chrome.

## Teknisk

- Ny tabel `push_subscriptions` (user_id, endpoint unik, nøgler, user agent, sidst set) med GRANTs og RLS, så en bruger kun ser/redigerer egne enheder; service_role har fuld adgang.
- To hemmeligheder tilføjes: VAPID public/private key (public key eksponeres til frontend via edge function-endpoint, ikke hardkodet).
- Ny service worker `public/push-sw.js` udelukkende til beskeder (`push` + `notificationclick`). Den eksisterende `public/sw.js` er en oprydnings-worker og røres ikke; push-workeren registreres separat og kun i produktion, ikke i preview/iframe.
- Ny hook `src/hooks/usePushNotifications.ts`: tilladelsesstatus, tilmeld/afmeld, gemmer subscription i tabellen, håndterer fornyelse ved ugyldigt endpoint.
- Ny edge function `send-push` (Deno + web-push via VAPID): modtager notifikations-id/bruger, henter brugerens enheder, sender, og sletter endpoints der svarer 404/410.
- Databasetrigger `AFTER INSERT ON public.notifications` (SECURITY DEFINER, `SET search_path = ''`) kalder `send-push` asynkront via `pg_net`; springer `is_demo`-rækker over. Ingen ændringer i eksisterende RLS-politikker.
- UI: `PushNotificationToggle` på profilen, prompt-kort i bunden af dashboardet (samme sted som installationsknappen), testknap i Admin.
- Alle tekster gennem oversættelseslaget (DA/EN), farver via semantiske tokens.
- Til sidst opdateres `CHANGELOG.md`, `docs/implementation-plan/tasks.md` og installationsvejledningen.
