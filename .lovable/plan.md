# Tre forbedringer: medarbejdervælger, cache-rydning og realtime-diagnostik

## 1. Mindre scroll i medarbejdervælgeren
- Desktop: vælgeren bliver bredere og højere, så flere navne er synlige ad gangen, og navnene vises i to kolonner når der er plads.
- Mobil: listen får mere af skærmens højde.
- Øverst i listen kommer et søgefelt, så man kan skrive et par bogstaver i stedet for at scrolle.
- Valgte medarbejdere vises altid øverst, så man hurtigt kan fjerne dem igen.
- Låse-forklaringerne (fuldt booket, ferie, kursus m.m.) og al eksisterende logik forbliver uændret.

## 2. Knap på Dashboard: "Ryd offline-cache"
- En diskret knap/kort på dashboardet, som rydder appens gemte offline-data, afregistrerer den gamle baggrundsservice og genindlæser siden helt frisk.
- Bekræftelsesdialog inden handlingen, med tekst om at man forbliver logget ind.
- Bruges når nogen sidder fast på en gammel version af appen.
- Dansk og engelsk tekst.

## 3. Diagnostik i Admin: realtime-forbindelser
- Ny fane "Diagnostik" i Admin (kun for administratorer/IT Support).
- Viser en liste over de aktive realtime-kanaler: hvilken tabel de lytter på, hvor mange dele af appen der bruger dem, og forbindelsesstatus (tilsluttet / lukket / fejl).
- Opdateres løbende, med en manuel opdateringsknap.
- Viser desuden appversion og om en gammel offline-service stadig er registreret i browseren.

## Teknisk
- `src/components/Planner/EmployeeSelector.tsx`: bredere `PopoverContent`, højere maks-højde (desktop `max-h-[70vh]`, mobil `max-h-[80dvh]`), responsivt to-kolonne-grid, søgefilter i lokal state, sortering med valgte først. Ingen ændring i `isDisabled`/lockReason-logik.
- `src/lib/realtimeChannels.ts`: eksporter en read-only `getRealtimeChannelDiagnostics()` som returnerer `{ channelKey, channelName, listenerCount, state }` fra `channels`-map'et og `registry.listenerCount()`; tilføj `listenerCount`-adgang i `RealtimeChannelRegistry` (findes allerede).
- Ny `src/components/Admin/RealtimeDiagnostics.tsx` + ny `TabsTrigger`/`TabsContent` i `src/pages/AdminPage.tsx`, gated som de øvrige admin-only faner.
- Ny `src/components/Dashboard/ClearCacheButton.tsx`: `caches.keys()` → slet app-caches, `navigator.serviceWorker.getRegistrations()` → `unregister()`, derefter `location.reload()`. Ingen ændring i auth-storage.
- Oversættelser tilføjes i `src/translations/da` og `src/translations/en`.
- Afslut med typecheck, opdatering af `CHANGELOG.md` og `docs/implementation-plan/tasks.md`.
