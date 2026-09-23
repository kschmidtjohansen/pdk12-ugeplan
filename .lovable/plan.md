# Gennemgå og rediger beskeden før den sendes

Det meste findes allerede: når AI'en har lavet forslaget, vises det som en telefonbesked, og både overskrift og tekst kan rettes i felterne under. Det der mangler, er selve "gennemgangen" — i dag rammer et enkelt klik på "Udsend notifikation" alle telefoner med det samme, uden at man ser hvem der får den.

Planen lukker de huller.

## Det der tilføjes

1. **Bekræft før udsendelse.** "Udsend notifikation" åbner et vindue, der viser beskeden som den vil se ud på telefonen, plus hvem der får den: afdeling, valgte roller og antal modtagere. Først "Send nu" sender.
2. **Antal modtagere vises på forhånd** — også i selve formularen, så man kan se målgruppen skifte, mens man vælger afdeling og roller.
3. **"Lav om"-knap** ved siden af forslaget, så man kan bede AI'en om et nyt forsøg uden at skrive teksten igen.
4. **"Fortryd mine rettelser"** viser sig kun, når man har rettet i AI'ens forslag, og sætter det tilbage til det oprindelige.
5. **Tegntællere** ved overskrift og besked, med en rolig markering når man nærmer sig det, der kan være på en låseskærm (45 og 130 tegn) — kun vejledende, ikke blokerende.
6. **Forhåndsvisningen opdateres, mens man skriver**, og viser også det valgte link, hvis der er et.

## Teknisk

**Edge function `broadcast-notification`**
- Ny `mode: 'preview_recipients'`: genbruger den eksisterende modtagerudvælgelse (afdeling via `profiles.home_department_id` + `user_access`, filtreret på roller, afsender fratrukket) og returnerer kun `{ count }`. Samme rolle- og afdelingskontrol som `send`.
- Modtagerudvælgelsen trækkes ud i en delt hjælpefunktion i samme fil, så `send` og `preview_recipients` ikke kan komme ud af trit.

**Frontend `src/components/Admin/BroadcastNotification.tsx`**
- Ny `useQuery` (`['broadcast_recipient_count', departmentId, roles]`, `staleTime` 30 s, debounce via `useDeferredValue` på roller) der kalder `preview_recipients`; fejl vises diskret som "—" i stedet for en toast.
- `AlertDialog` med forhåndsvisning + målgruppe + antal; `handleSend` flyttes til dialogens bekræft-knap med spinner.
- `generatedTitle`/`generatedMessage` gemmes i state ved hvert AI-svar, så "Fortryd mine rettelser" kan vises betinget (`title !== generatedTitle || message !== generatedMessage`).
- "Lav om" kalder `handleGenerate` igen (samme råtekst og målgruppe).
- Tegntællere som `text-xs text-muted-foreground`, skifter til `text-warning` over grænsen; semantiske tokens, 44×44 px trykflader, DA/EN.

**Oversættelser** i `src/translations/{da,en}/admin.ts` under `admin.broadcast`: `confirmTitle`, `confirmBody`, `confirmSend`, `confirmCancel`, `audienceLabel`, `recipientCount`, `regenerate`, `resetEdits`, `charsLeft`, `previewLink`.

Til sidst opdateres CHANGELOG.md og `docs/implementation-plan/tasks.md`.
