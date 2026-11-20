# Facet: PolyPlans designsprog

Facet erstatter "Nordic Operations" (`docs/ui-guidelines/design-system.md`). Planen og skitserne ligger i Claude:
plan https://claude.ai/artifact/MC9jgPozHWpAYbgx1aSY7n og skitser https://claude.ai/artifact/1a1FsznXu9s6bGNRHfHTi4.

Facet ændrer udtrykket, ikke funktionerne. Al booking, alle rettigheder, data og sider virker som før.

## Fire ideer

1. **Dybde.** Appen er bygget af lag. Kort har en lys kant foroven og en blød skygge; det, man rører, løfter sig.
2. **Rum og tid.** Arbejdet sker på adresser og klokkeslæt. Dagen vises som tidslinje, tavle og dagskort.
3. **Liv.** Nu-linjen glider, en kollegas ændring lyser kort op, og bevægelse forklarer, hvor noget kom fra.
4. **Felten først.** Telefonen er ikke en mindre computer. Store knapper, én hånd og læsbar i sollys.

## Farver

PolyPlans egne farver i `src/index.css` bevares. Brug altid tokens, aldrig farvekoder i komponenter.

| Token | Brug |
| --- | --- |
| `--primary` (Polygon-blå #00ACF0) | Primærknap, valgt punkt, nu-linje, fokus, glød |
| `--primary-foreground` (brand-ink #003652) | Tekst og ikoner **på** Polygon-blå. Aldrig hvid tekst på blå (2,6:1) |
| `--primary-strong` (#00668F) | Blå tekst på lyse flader: links, små etiketter, store tal | `text-primary` peger også hertil (Tailwind `textColor`), så blå tekst altid har nok kontrast |
| `--sidebar-accent` (#EBF9FF) | Valgt punkt i menuen, bløde markeringer, Dagslys |
| `--background`, `--card`, `--muted`, `--border` | Flader og linjer |
| `--success`, `--warning`, `--destructive`, `--info` + `-soft` | Status, altid med ord eller ikon |
| `--brand-deep` | Mørk tilstand og små mørke flader |

Opgavetyper (Vandskade, Brandskade, Skimmel, Andet) får **ingen** egne farver. Typen vises med ikon i en glasbrik og ord.
Opgaver har ingen status ud over publiceret eller ej; design ikke statusforløb.

## Skrift

| Rolle | Skrift | Tailwind |
| --- | --- | --- |
| Brødtekst | Inter | `font-sans` (standard) |
| Overskrifter, store tal | Schibsted Grotesk | `font-display` (h1–h3 får den automatisk) |
| Sagsnumre, bilnumre, klokkeslæt | Geist Mono | `font-mono` eller `.facet-mono` |

## Form og materialer

| Navn | Tailwind / klasse | Brug |
| --- | --- | --- |
| Hjørner | `rounded-control` 10, `rounded-card` 14, `rounded-panel` 20, `rounded-sheet` 28 | Knapper/felter, kort, paneler, ark på telefon |
| Flade | `shadow-flade` eller `.facet-card` | Kort og tabeller (`Card` har det som standard) |
| Løftet | `.facet-lift` eller `shadow-loeftet` | Det, man rører og trækker |
| Flydende | `shadow-flydende` | Menuer og popovers |
| Øverst | `shadow-oeverst` | Dialoger, kommandolinje, ark |
| Glas | `.facet-glass` | **Kun** toplaget: kommandolinje, menuer, bundmenu, panelhoveder |
| Glasbrik | `.facet-chip` | Ikon for opgavetype eller menu |
| Blødt lys | `.facet-glow` | Bag Dagslys, panelhoveder og login. Aldrig på lister |
| Dagslys | `.facet-dagslys` + `data-tid="morgen|dag|aften"` | Toppen af Dashboard |
| Nu-linje | `.facet-now-line` | Tidslinje og tavle |
| Glasfelt | `.facet-tile` | Statusbrikker oven på Dagslys |
| Nål | `.facet-map-pin` (+ `.is-now`, `.is-past`) | Nummer på dagskortet og i "Dagens forløb" |
| I dag | `.facet-today` + `.facet-today-badge` | Dagens sektion i Ugeplan |
| Dagskort | `DayMap` (Leaflet, OpenStreetMap) | Kun Dashboard, indlæses dovent. Grundkortet dæmpes med filter |
| Næste-banner | `.facet-next-banner` | Min Dag: hvad sker nu eller næste |
| Opgavekort (felt) | `.facet-task-card` + `.facet-task-hero` i `.facet-deck` | Min Dag, ét kort ad gangen med scroll-snap |
| Feltknap | `Button` + `.facet-field-btn` | Mindst 56 px høj, til én hånd |
| Bundmenu | `.facet-bottom-nav`, `.facet-tab-active`, `.facet-tab-pill` | Telefonens navigation |
| Sollys | `html.sollys` (`src/lib/sollys.ts`, `useSollys`) | Høj kontrast udendørs; slås til i brugermenuen eller via enhedens kontrastindstilling |
| Segment | `TabsList`, `SlidingSegments`, `ModuleListTools` + `.facet-tab-thumb` | Faner og filtre: rund pille med blød flade under det valgte |
| Skærm | `.facet-screen` (em-skala ud fra vw), `.facet-screen-card`, `-car`, `-avatar`, `-pill`, `-progress` | Storskærm: `ScreenOverview` 07–09, `ScreenSignage` efter 09 (`screenModel.ts`) |
| Skeleton | `.facet-skeleton` | Indlæsning i indholdets form |
| Primærknap | `Button` (default) | Polygon-blå, brand-ink tekst og `shadow-brand` |

Logoerne bruges uændrede: `public/favicon.svg` (PolyPlan) og `src/assets/polygon-mark.png` (Polygon). Ingen mønstre.

## Bevægelse

Én kurve, `ease-facet` (`cubic-bezier(0.2, 0, 0, 1)`), og tre varigheder: `duration-140` (hover, tryk), `duration-200`
(menuer, faner) og `duration-320` (paneler, sideskift). Alt respekterer "Reducer bevægelse".

## Værn

- WCAG 2.2 AA i lys og mørk tilstand. Tekst 4,5:1, ikoner og rammer 3:1.
- Glas kun i toplaget. Ingen glød, gradienter eller animationer på lister.
- Status, konflikt og type har altid ord eller ikon ud over farve.
- Første indhold under 1,5 s på en mellemklasse-telefon.

## Regler for Lovable og os

- Brug tokens og klasserne ovenfor. Ingen hex-koder, `rgb()` eller faste Tailwind-farver (`blue-500`) i komponenter.
- Ingen nye UI-kits (Magic UI, Cult UI, Aceternity m.fl.) og ingen effekter uden for listen.
- Behold props og varianter i `src/components/ui`; ændr udseendet via tokens.
- ESLint advarer om farvekoder i `src/components` og `src/pages`.

## Faser

1. Fundament (denne): tokens, skrifter, materialer, dette dokument, regler og lint.
2. Rammen: sidemenu, kommandopille, notifikationscenter, panel.
3. Kernesiderne: Dashboard med Dagslys og dagskort, Ugeplan.
4. Felten: Min Dag, bundmenu, ark, sollys.
5. Øvrige sider.
6. Skærmvisning og mørk tilstand.
