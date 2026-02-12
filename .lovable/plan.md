

## Plan: Opdater mappestruktur i README.md

README'ens mappestruktur mangler flere mapper der reelt eksisterer. Her er de konkrete afvigelser og rettelser:

### Manglende mapper under `/src/components`

| Mappe | Beskrivelse (DK) | Beskrivelse (EN) |
|-------|-------------------|-------------------|
| `/Assignment` | Opgavedetaljer med filer og beskeder | Assignment details with files and messages |
| `/AutoPublish` | Automatisk publicering af opgaver | Auto-publishing of assignments |
| `/Demo` | Demo-tilstand med rolleskift | Demo mode with role switching |
| `/Duty` | Vagtplanlægning og -bytte | Duty scheduling and swapping |
| `/ErrorBoundary` | Fejlhåndtering på side- og dataniveau | Page and data-level error boundaries |
| `/Notifications` | Notifikationskomponenter | Notification components |
| `/Profile` | Profilbillede og adgangskode | Profile picture and password |
| `/ScreenDisplay` | Skærmvisning af ugeplaner | Screen display of weekly plans |
| `/Security` | Sikkerhedsstatus-panel | Security status panel |
| `/shared` | Genbrugelige komponenter (loading, empty states) | Reusable components (loading, empty states) |

### Manglende mapper under `/src/hooks`

| Mappe | Beskrivelse (DK) | Beskrivelse (EN) |
|-------|-------------------|-------------------|
| `/data` | Hooks til samlet datahåndtering | Hooks for unified data handling |
| `/duty` | Hooks til vagthåndtering | Hooks for duty handling |

### Manglende mapper under `/src`

| Mappe | Beskrivelse (DK) | Beskrivelse (EN) |
|-------|-------------------|-------------------|
| `/config` | Konfigurationsfiler (sikkerhed) | Configuration files (security) |
| `/integrations` | Supabase client og RPC helpers | Supabase client and RPC helpers |
| `/lib` | Utility-funktioner (cn/tailwind-merge) | Utility functions (cn/tailwind-merge) |

### Tekniske detaljer

Begge mappestruktur-sektioner (dansk linje 92-121, engelsk linje 232-261) opdateres med den komplette liste. Rækkefølgen følger den faktiske filsystem-sortering (alfabetisk).

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `README.md` | Opdater begge mappestruktur-sektioner (dansk + engelsk) med alle manglende mapper |

