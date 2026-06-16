## Mål
Flyt "Ferieoversigt" (kalender) fra Admin-siden til `/vacation`-siden. Adgang: Administrator, Skadeleder og IT Support (super_admin).

## Ændringer

### 1. `src/pages/AdminPage.tsx`
- Fjern `VacationCalendarOverview`-import.
- Fjern `<TabsTrigger value="vacationCalendar">` (linje 94-97) og tilhørende `<TabsContent value="vacationCalendar">` (linje 151-153).
- Fjern `CalendarDays` fra lucide-imports hvis ikke længere brugt.

### 2. `src/components/Vacation/VacationTabs.tsx`
- Tilføj betinget 4. tab `"calendar"` (Ferieoversigt) som kun vises når `canViewCalendar` er sand (admin/skadeleder/super_admin).
- Tilpas grid-cols dynamisk (`grid-cols-3` → `grid-cols-4` når kalender vises).
- Modtag ny prop `canViewCalendar: boolean`.

### 3. `src/components/Vacation/VacationHeader.tsx`
- Beregn `canViewCalendar = isEffectiveAdmin || isEffectiveSkadeleder || isSuperAdmin` (super_admin = IT Support).
- Send `canViewCalendar` videre til `VacationTabs`.
- Skjul "Anmod om ferie"/"Anmod for medarbejder"-knapper når `activeTab === 'calendar'` (knapper er irrelevante for kalendervisning).

### 4. `src/components/Vacation/VacationTabContent.tsx`
- Tilføj rendering: når `tabValue === 'calendar'` → render `<VacationCalendarOverview />` i stedet for ferielisten.

### 5. `src/components/Vacation/VacationPageContainer.tsx`
- Hent `isSuperAdmin` fra `useAuth()` og send `canViewCalendar` videre via `VacationHeader`.

### 6. Oversættelser
- Tilføj `vacation.tabs.calendar` = "Ferieoversigt" (da) / "Vacation calendar" (en) i `src/translations/{da,en}/vacation.ts`.

### 7. Dokumentation
- `CHANGELOG.md`: "Flyttet Ferieoversigt fra Admin til /vacation. Adgang: Administrator, Skadeleder, IT Support."
- `docs/implementation-plan/tasks.md`: markér tilhørende opgave `[x]` hvis relevant.

## Sikkerhed
Ingen RLS-ændringer — `VacationCalendarOverview` bruger eksisterende hooks med samme dataadgang som før. Tab-synlighed er ren UI-gating; backend RLS håndhæver fortsat læsning af ferie-data.
