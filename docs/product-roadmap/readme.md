# Product Roadmap

Denne mappe beskriver den langsigtede vision for PDK12 Ugeplan.

## Nuværende tilstand

Systemet er et internt planlægningsværktøj til skadesservice med følgende kernemoduler:
- **Planlægger** — Ugentlig opgavefordeling med medarbejdere og biler
- **Medarbejdere** — Profiler, fravær, vikarer med udløbsdato
- **Biler** — Flådestyring med multi-underafdeling via junction-tabel
- **Ferie** — Ansøgning og godkendelse med RLS pr. afdeling
- **Vagtplan** — Skadeleder- og kørevagt
- **Lager** — Lagerstyring pr. underafdeling
- **Admin** — Brugerstyring, afdelinger, feature toggles

## Understøttelse af flere afdelinger

Systemet er allerede designet til multi-afdeling:
- `departments` og `sub_departments` tabeller
- `user_access` junction-tabel for bruger-til-afdeling mapping
- Feature toggles pr. afdeling (`chat_enabled`, `duty_enabled`, `warehouse_enabled` osv.)
- Afdelingsskift via header-selector

### Fremtidig udrulning

1. **Nye afdelinger** oprettes via Admin → Afdelingsstyring
2. **Brugere tildeles** afdelinger via `user_access`
3. **Feature toggles** aktiveres individuelt pr. afdeling
4. **Data er isoleret** via RLS-politikker baseret på `department_id` og `sub_department_id`

## Fremtidige muligheder

- Integration med OneDrive/SharePoint til sagsmapper
- PDF-eksport af ugeplaner
- Push-notifikationer til mobil
- Avanceret rapportering og statistik
- Automatisk vagtfordeling baseret på regler
