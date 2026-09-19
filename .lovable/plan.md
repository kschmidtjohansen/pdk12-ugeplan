# Fjern "Mine Statistikker" fra servicemedarbejder-forsiden

## Mål
Statistikboksen "Mine Statistikker" ("I dag: X opgaver" / "Denne uge: X opgaver") fjernes helt fra forsiden for servicemedarbejdere. Siden åbner derefter med "Min Dag" øverst, derefter vagtoversigt og "Mine Opgaver".

## Ændringer

**`src/components/Dashboard/ServicemedarbejderDashboard.tsx`**
- Hele statistik-kortet (Card med "Mine Statistikker", de to tællerbokse "I dag" og "Denne uge") slettes fra siden.
- Alt kode der kun bruges af statistikken fjernes samtidig, så filen ikke efterlades med ubrugt logik:
  - Tælleberegningerne `todayAssignments`, `weeklyAssignments` og `userAssignments` (bruges kun til tallene; "Mine Opgaver" og "Min Dag" henter deres egne data).
  - `LastRefreshIndicator` og "opdater"-knappen, som kun boede i statistikkortets overskrift (`handleManualRefresh`, `isRefreshing`, `lastRefresh`, `fetchAssignments`-kaldet).
  - Ubrugte imports (`Calendar`, `Clock`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `LastRefreshIndicator`, `getCurrentWeekInfo`/`getWeekDates`, `format`/`parseISO` hvor relevant).

**Efter ændringen står forsiden sådan:**
```text
Servicemedarbejder-forside
├─ Min Dag (dagens rute)            — uændret
├─ Vagtoversigt (kun hvis vagt slået til) — uændret
└─ Mine Opgaver (denne uge)         — uændret
```

## Teknisk
- Kun præsentation og oprydning i én fil — ingen ændringer i data, rettigheder eller øvrige sider.
- Verifikation: typetjek og kodetjek, visuel kontrol af forsiden (mobil + desktop).
- `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres til sidst.
