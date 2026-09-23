# Notifikationer der virker på Android og iPhone — uanset browser

Målet: notifikationer skal fungere pålideligt på Android (Edge, Chrome) og iPhone (Safari), med den klare forudsætning at appen først er installeret på hjemmeskærmen.

## Det jeg fandt i den nuværende opsætning

- **App-ikonet er for lille.** Der findes kun ét ikon på 177×172 pixels, men det er registreret som både 192×192 og 512×512. Både Chrome og Edge kræver rigtige ikoner i de størrelser, før de tilbyder "Installer app" stabilt — og iPhone bruger et separat ikon på 180×180. Det gør installationen ustabil i dag.
- **Kravet om installation håndhæves kun på iPhone.** På Android kan man slå notifikationer til i browseren uden at have installeret appen. Beskederne lander så i browseren i stedet for i appen, og forsvinder hvis brugeren rydder browseren. Det matcher ikke jeres forudsætning.
- **Tilmeldingen kan falde af uden at nogen opdager det.** Telefoner udskifter jævnligt den adresse, beskederne sendes til. Sker det, stopper notifikationerne lydløst, indtil brugeren selv går ind og trykker "Slå til" igen.
- **Ingen måde at se hvorfor det ikke virker.** Når en medarbejder siger "jeg får ingen beskeder", er der intet sted at se om det skyldes manglende installation, afvist tilladelse eller en død tilmelding.

## Det jeg laver

### 1. Rigtige app-ikoner
Nye ikoner i 192×192, 512×512 og 180×180 til iPhone, med Polygon-logoet på en ren baggrund. Registreres korrekt, så både Edge, Chrome og Safari viser et skarpt ikon på hjemmeskærmen og i selve notifikationen.

### 2. Installation som forudsætning — ens på alle platforme
Notifikationskortet slår først til, når appen kører fra hjemmeskærmen. Er den ikke installeret, viser kortet i stedet en kort vejledning, der matcher den browser man står i:
- **Edge på Android:** menuen (…) → "Føj til telefon" / "Installer app"
- **Chrome på Android:** menuen (⋮) → "Installer app" / "Føj til startskærm"
- **Safari på iPhone:** Del-knappen → "Føj til hjemmeskærm"
- **Chrome/Edge på iPhone:** besked om at installationen skal ske i Safari

Hvor browseren tilbyder det (Android), vises den eksisterende "Installer"-knap direkte i kortet, så det klares med ét tryk.

### 3. Tilmeldingen holder sig selv i live
Når appen åbnes fra hjemmeskærmen og brugeren har givet tilladelse, gentilmelder appen sig selv automatisk i baggrunden, hvis tilmeldingen er faldet af. Telefonens egen udskiftning af beskedadressen fanges også og opdateres automatisk. Brugeren skal altså kun godkende én gang pr. telefon.

### 4. Et tydeligt statusfelt til fejlsøgning
Nederst i notifikationskortet en lille statuslinje: installeret ja/nej, tilladelse givet/afvist, tilmeldt ja/nej, og hvornår der sidst blev sendt en testbesked. Så kan I og brugeren se på to sekunder, hvad der mangler.

### 5. Test på rigtige enheder
Jeg tester selv det tekniske (tilmelding gemmes, serveren sender, fejlkoder rydder døde tilmeldinger op) og verificerer at en ny notifikation i systemet udløser en push-besked. Den endelige bekræftelse kræver, at siden er udgivet, og at I trykker "Send test" på én Android-telefon og én iPhone — det kan ikke gøres fra redigeringsvisningen.

## Teknisk

- Nye ikoner under `public/` (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`); `public/manifest.webmanifest` opdateres med separate `any`- og `maskable`-poster, `id` og `display_override`; `index.html` får korrekt `apple-touch-icon`-link.
- `src/hooks/usePushNotifications.ts`: ny status `needs-install` for alle platforme (standalone-tjek via `display-mode: standalone` + `navigator.standalone`), browser-/platformsdetektion eksponeres, samt en `ensureSubscription()` der kaldes ved app-start i standalone og gentilmelder ved manglende subscription.
- `public/push-sw.js`: håndtering af `pushsubscriptionchange` — gentilmelder med samme VAPID-nøgle og sender den nye endpoint til en ny, offentlig edge-funktion `push-resubscribe`, som matcher på den gamle endpoint og opdaterer rækken i `push_subscriptions` (ingen nye rettigheder til klienten; ingen RLS-ændringer).
- `src/components/Pwa/PushNotificationCard.tsx`: installationsvejledning pr. browser, genbrug af `PwaInstallButton`, og en diskret diagnose-linje. Alle farver via semantiske tokens, tekster gennem oversættelseslaget (DA/EN), trykflader ≥44×44 px.
- Ingen ændringer i forretningslogik, rettigheder eller eksisterende RLS-politikker.
- Til sidst: `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres, og installationsguiden opdateres med de præcise browser-trin.
