
## Fase 4: UI/UX og Responsivitet

### Status: Gitter-visning allerede implementeret

Gitter-knappen med `LayoutGrid`-ikonet eksisterer allerede i PlannerPage (linje 487-490). `DaySection` renderer korrekt med `md:grid-cols-3` naar `gridLayout=true` (linje 113). AssignmentCard har allerede `line-clamp-3` paa beskrivelser (linje 210).

**Ingen ny funktionalitet noedvendig** for grid view - kun visuel finpudsning.

---

### 1. Tema-konsistens: Erstat hardcoded gray-farver

Erstat `text-gray-600`, `text-gray-500`, `text-gray-400`, `bg-gray-50`, `bg-gray-100`, `hover:bg-gray-50`, `hover:bg-gray-100` med tema-tokens i foelgende filer:

| Fil | Antal erstatninger | Eksempel |
|-----|--------------------|----------|
| `src/pages/PlannerPage.tsx` | 2 | `text-gray-600` -> `text-muted-foreground` |
| `src/components/Planner/CarSelector.tsx` | 2 | `hover:bg-gray-50` -> `hover:bg-muted/50` |
| `src/components/Admin/UserManagement.tsx` | 4 | `text-gray-500` -> `text-muted-foreground` |
| `src/components/shared/LoadingSpinner.tsx` | 1 | `text-gray-500` -> `text-muted-foreground` |
| `src/components/Layout/TopNavbar.tsx` | 3 | `border-gray-200` -> `border-border`, `text-gray-700` -> `text-foreground` |
| `src/components/Vacation/EnhancedVacationCard.tsx` | 1 | `bg-gray-600` -> `bg-muted-foreground` |

**Udeladt**: `from-gray-25` og `to-gray-50` er **custom CSS-variabler** (defineret i index.css), ikke hardcoded Tailwind — disse bevares.

---

### 2. Fjern debug-logging i AssignmentDetails.tsx

`AssignmentDetails.tsx` har 4 uguardede `console.log` (linje 89-95, 112) der logger medarbejder-data i produktion. Wrap i `import.meta.env.DEV` guard.

---

### 3. Horisontal scroll paa tabeller (mobil)

Tilfoej `overflow-x-auto` wrapper paa:
- `src/components/Cars/CarsTable.tsx` (linje 42: aendr `overflow-hidden` -> `overflow-x-auto`)
- `src/components/Warehouse/WarehouseTable.tsx` (linje 11: tilfoej `overflow-x-auto` paa outer div)

Dette sikrer at tabeller kan scrolles horisontalt paa smaa skaerme uden at oedelaegge resten af layoutet.

---

### 4. Standardisering af tomme tilstande

`DaySection.tsx` bruger allerede korrekt tom-tilstand med `CalendarX2`-ikon, `border-dashed`, `bg-muted/20` og tema-farver (linje 131-134). Denne er konsistent med design-systemet.

**Verificeret**: Ingen yderligere aendringer noeudvendige.

---

### 5. Hover-effekter paa opgavekort

`AssignmentCard` har allerede `hover:border-polygon-purple hover:shadow-xl transition-all duration-200` (linje 137). `CompactAssignmentRow` har `hover:bg-muted/50 transition-colors` (linje 71).

**Verificeret**: Allerede implementeret.

---

### 6. Dokumentation

| Fil | Handling |
|-----|---------|
| `docs/implementation-plan/tasks.md` | Tilfoej Fase 4 med opgaver markeret [x] |
| `docs/ui-guidelines/component-library.md` | Tilfoej gitter-regler sektion |
| `CHANGELOG.md` | Dokumenter UI-forbedringer |

---

### Samlet filplan

| Fil | Handling |
|-----|---------|
| `src/pages/PlannerPage.tsx` | Erstat 2 hardcoded `text-gray-600` med `text-muted-foreground` |
| `src/components/Planner/CarSelector.tsx` | Erstat `hover:bg-gray-50` med `hover:bg-muted/50` |
| `src/components/Planner/AssignmentDetails.tsx` | DEV-guard paa 4 console.log |
| `src/components/Admin/UserManagement.tsx` | Erstat 4 hardcoded gray-farver med tema-tokens |
| `src/components/shared/LoadingSpinner.tsx` | Erstat `text-gray-500` med `text-muted-foreground` |
| `src/components/Layout/TopNavbar.tsx` | Erstat 3 hardcoded gray-farver med tema-tokens |
| `src/components/Vacation/EnhancedVacationCard.tsx` | Erstat `bg-gray-600` med tema-token |
| `src/components/Cars/CarsTable.tsx` | Tilfoej `overflow-x-auto` for mobil horisontal scroll |
| `src/components/Warehouse/WarehouseTable.tsx` | Tilfoej `overflow-x-auto` for mobil horisontal scroll |
| `docs/implementation-plan/tasks.md` | Marker Fase 4 som fuldfoert |
| `docs/ui-guidelines/component-library.md` | Tilfoej gitter-visnings-regler |
| `CHANGELOG.md` | Dokumenter UI-forbedringer |

### Hvad der IKKE aendres

- Grid-view logik (allerede fungerende med 3-kolonne layout)
- AssignmentCard layout og datafelter (alle felter bevares)
- Chat- og fil-interface (allerede implementeret med korrekt upload-indikator)
- Custom `gray-25`/`gray-50` CSS-variabler (disse er tema-kompatible)
- Eksisterende hover-effekter og tomme tilstande (allerede korrekte)
