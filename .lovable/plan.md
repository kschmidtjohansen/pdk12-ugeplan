

## Plan: Notifikation ved >50% ferie i samme uge

### Beskrivelse

Udvid `useVacationNotifications` med en ny funktion der tjekker om mere end 50% af servicemedarbejderne i den valgte afdeling har godkendt ferie i samme uge — for de kommende 8 uger. Hvis ja, oprettes en notifikation til administratoren.

### Implementering

#### 1. `src/hooks/notifications/vacationNotifications.ts` — Ny funktion

Tilfoej `checkHighVacationWeeks` i hooken:
- Henter godkendte ferier for de naeste 8 uger fra `vacations` (status = 'approved', department_id = selectedDepartmentId)
- Henter antal aktive servicemedarbejdere i afdelingen (via `user_roles` + `user_access` + `profiles`)
- Beregner per uge: antal unikke medarbejdere paa ferie vs. total
- Hvis >50%: tjek om der allerede findes en ulæst notifikation for den uge (matcher paa ugenummer i besked)
- Hvis nej: opret notifikation med type 'vacation', link til '/admin' (vacationCalendar-fanen)

Kaldes i samme `useEffect` som `createNotificationsForPendingRequests`.

#### 2. Oversaettelser

**da/notifications.ts:**
- `vacationHighCoverage`: "Advarsel: Uge {week} har mere end 50% af servicemedarbejderne på ferie ({count}/{total})"
- `vacationHighCoverageTitle`: "Høj feriedækning"

**en/notifications.ts:**
- `vacationHighCoverage`: "Warning: Week {week} has more than 50% of service employees on vacation ({count}/{total})"
- `vacationHighCoverageTitle`: "High vacation coverage"

#### 3. `CHANGELOG.md` — Dokumenter

### Filer der aendres

| Fil | AEndring |
|-----|---------|
| `src/hooks/notifications/vacationNotifications.ts` | Tilfoej `checkHighVacationWeeks` |
| `src/translations/da/notifications.ts` | Tilfoej oversaettelser |
| `src/translations/en/notifications.ts` | Tilfoej oversaettelser |
| `CHANGELOG.md` | Dokumenter feature |

