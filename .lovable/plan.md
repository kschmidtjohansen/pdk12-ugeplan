

## Visuel tema-fix + Komplet docs-mappestruktur

### Del 1: Hardcoded farver i CarsTable og MobileCarCard

#### CarsTable.tsx (17 erstatninger)

| Linje | Fra | Til |
|-------|-----|-----|
| 45 | `border-gray-100` | `border-border` |
| 46-52 | `text-gray-600 font-medium` (7 stk) | `text-muted-foreground font-medium` |
| 57 | `border-gray-100 hover:bg-gray-50/50` | `border-border hover:bg-muted/50` |
| 63 | `text-gray-900` | `text-foreground` |
| 66 | `text-gray-900` | `text-foreground` |
| 69 | `text-gray-900` | `text-foreground` |
| 94 | `bg-gray-100 text-gray-800` | `bg-muted text-foreground` |
| 101 | `text-gray-900` | `text-foreground` |
| 125 | `text-gray-400` (X-ikon) | `text-muted-foreground/50` |
| 126 | `text-gray-600` | `text-muted-foreground` |
| 135 | `text-gray-900` | `text-foreground` |
| 140 | `text-gray-900` | `text-foreground` |
| 172 | `text-gray-400` (ToggleLeft) | `text-muted-foreground` |

#### MobileCarCard.tsx (19 erstatninger)

| Linje | Fra | Til |
|-------|-----|-----|
| 38 | `border-gray-100` | `border-border` |
| 50 | `text-gray-900` | `text-foreground` |
| 55 | `text-gray-600` | `text-muted-foreground` |
| 74 | `text-gray-400` (ToggleLeft) | `text-muted-foreground` |
| 125 | `text-gray-500` | `text-muted-foreground` |
| 127 | `text-gray-900` | `text-foreground` |
| 137 | `text-gray-500` | `text-muted-foreground` |
| 142 | `text-gray-900` | `text-foreground` |
| 146 | `text-gray-400` (X-ikon) | `text-muted-foreground/50` |
| 147 | `text-gray-600` | `text-muted-foreground` |
| 156 | `text-gray-500` | `text-muted-foreground` |
| 157 | `bg-gray-100 text-gray-800` | `bg-muted text-foreground` |
| 163 | `border-gray-100` | `border-border` |
| 179 | `bg-gray-50` | `bg-muted/50` |
| 180 | `text-gray-700` | `text-foreground` |
| 181 | `text-gray-600` | `text-muted-foreground` |
| 187 | `border-gray-100` | `border-border` |
| 192 | `text-gray-900` | `text-foreground` |
| 197 | `text-gray-900` | `text-foreground` |

Semantiske farver (green-500, red-500, blue-500, orange-500) bevares, da de er funktionelle statusfarver.

---

### Del 2: Manglende docs-filer

Eksisterende filer der allerede er udfyldt og bevares:
- `implementation-plan/readme.md` og `tasks.md`
- `product-roadmap/readme.md`
- `technical-specs/readme.md`, `architecture.md`, `data-models.md`
- `ui-guidelines/readme.md`, `component-library.md`

#### Nye filer der oprettes (5 stk)

**1. `docs/implementation-plan/timeline.md`**
Milepalsplan med 3 faser:
- Fase 1-4: Faerdiggjort 2026-02-15 (Sikkerhed, Database, Performance, UI)
- Proveperiode: Uge 10 (2026-03-02 til 2026-03-06) -- intern test med reelle brugere
- Udrulning: Uge 12 (2026-03-16) -- produktionslancering for foerste afdeling
- Fremtidige afdelinger: Loebende efter uge 12

**2. `docs/product-roadmap/features.md`**
Opdelt i nuvaerende og kommende features:
- Nuvaerende: Multi-afdeling, Chat (assignment_messages), Fil-upload, Vagtplan, Lager, Ferie, Demo mode
- Kommende: OneDrive/SharePoint-integration, PDF-eksport, Push-notifikationer, Avanceret rapportering, Automatisk vagtfordeling

**3. `docs/product-roadmap/user-personas.md`**
Definition af alle 5 roller:
- Super Admin: Fuld systemadgang, alle afdelinger, brugerstyring
- Administrator (Chef): Afdelingsleder, godkender ferie, opretter opgaver
- Skadeleder: Daglig planlaegning, vagtbytter, brændstofkort-adgang
- Servicemedarbejder: Ser egne opgaver og kolleger, ansoeger ferie
- Vikar: Midlertidig med udloebsdato, begranset adgang

**4. `docs/technical-specs/database-schema.md`**
Detaljeret gennemgang af tabel-relationer med fokus paa afdelingsstruktur:
- `departments` -> `sub_departments` (1:N)
- `user_access` junction: bruger <-> afdeling/underafdeling
- `car_sub_departments` junction: bil <-> underafdeling
- `assignments` -> `department_id` + `sub_department_id` (afdelingsfiltrering)
- RLS-isolation via `can_access_department_data()`
- Backup-rutiner: 2x dagligt (Supabase automatisk + custom)

**5. `docs/ui-guidelines/design-system.md`**
Regler for de 3 visningstyper med konkrete CSS-klasser:
- Standard: Fuld kortvisning, `shadow-sm`, alle detaljer synlige
- Kompakt: Tabel-layout, reduceret padding, hover-actions
- Gitter: `md:grid-cols-3`, `line-clamp-3` paa beskrivelser
- Farve-tokens: Komplet liste over semantiske variabler
- Spacing-skala: `py-8` (tom tilstand), `py-12` (EmptyState), `p-4`/`p-6` (kort)
- Breakpoints: Mobile-first, `md:` for tablet, `lg:` for desktop

---

### Samlet filplan

| Fil | Handling |
|-----|---------|
| `src/components/Cars/CarsTable.tsx` | Erstat 17 hardcoded farver |
| `src/components/Cars/MobileCarCard.tsx` | Erstat 19 hardcoded farver |
| `docs/implementation-plan/timeline.md` | Opret med milepale |
| `docs/product-roadmap/features.md` | Opret med nuvaerende/kommende features |
| `docs/product-roadmap/user-personas.md` | Opret med 5 rollerbeskrivelser |
| `docs/technical-specs/database-schema.md` | Opret med afdelingsrelationer og backup |
| `docs/ui-guidelines/design-system.md` | Opret med visningsregler og tokens |
| `docs/implementation-plan/tasks.md` | Tilfoej ny opgave under Fase 4 |
| `CHANGELOG.md` | Opdater med alle aendringer |

