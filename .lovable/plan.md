## Mål
I `/screen-display` skal headeren vise et orange badge med antal og navne på fraværende medarbejdere for den valgte dato — for hele afdelingen (uafhængigt af sub-afdeling).

## Hvad tæller som "fraværende"
1. **Godkendt ferie for dagen**: rækker i `vacations` hvor `status = 'approved'` og `selectedDate` ligger mellem `start_date` og `end_date`, filtreret på `department_id`.
2. **On leave / inaktiv**: `profiles` hvor `status = 'on_leave'` eller `on_leave = true`, joinet via `user_access` til afdelingen (`home_department_id` eller `user_access.department_id`).

Sammensæt unikt sæt af medarbejdere (dedupliker på `user_id`). Skjul medarbejdere med `status = 'terminated'` eller `is_visible_in_planning = false`.

## Implementering

### 1) Ny hook
`src/hooks/useScreenDisplayAbsences.ts`
- Input: `date: string`, `departmentId: string | null`
- Returnerer `{ absences: { id: string; name: string }[]; loading: boolean }`
- To parallelle Supabase-queries:
  - `vacations` filtreret på `department_id`, `status=approved`, og dato i interval — joined med `profiles(id, name)`.
  - `profiles` filtreret på afdelingen (via `user_access` eller `home_department_id`) med `status='on_leave'` eller `on_leave=true`.
- Merge + dedup på id, sortér alfabetisk.
- Re-fetch når `date` eller `departmentId` ændres. Ingen realtime (page'en refetcher i forvejen hvert 5. min).

### 2) Opdater header
`src/components/ScreenDisplay/ScreenDisplayHeader.tsx`
- Tilføj props: `absences: { id: string; name: string }[]`
- Render orange badge til højre for titel-blokken (før date-navigationen, wrap pænt på smal viewport):
  - Skjul helt hvis `absences.length === 0`.
  - Format: `Fraværende (N): Navn1, Navn2, Navn3` — efter 3 navne vis `+X mere`.
  - Tooltip viser fuld liste.
- Brug semantiske tokens. Tilføj ny token til `index.css` + `tailwind.config.ts`: `--warning` / `--warning-foreground` i HSL (orange), så vi ikke hardkoder farve. Badge bruger `bg-warning text-warning-foreground`.

### 3) Wire i page
`src/pages/ScreenDisplayPage.tsx`
- Kald `useScreenDisplayAbsences(selectedDateStr || format(new Date(),'yyyy-MM-dd'), departmentId)`.
- Send `absences` til `ScreenDisplayHeader`.

### 4) Oversættelser
- `src/translations/da/screenDisplay.ts`: `absent: 'Fraværende'`, `absentMore: '+{count} mere'`.
- `src/translations/en/screenDisplay.ts`: `absent: 'Absent'`, `absentMore: '+{count} more'`.

### 5) Dokumentation
- `CHANGELOG.md`: kort entry.
- `docs/implementation-plan/tasks.md`: marker som tilføjet feature.

## Out of scope
- Ændringer i rotation-overlay eller `ScreenDisplayContent`.
- Realtime-opdatering af fravær.
- Sub-afdelings-filtrering (bevidst hele afdelingen).
- Ændringer i RLS/migrationer — eksisterende SELECT-policies på `vacations` og `profiles` dækker behovet.
