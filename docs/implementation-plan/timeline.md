# Implementeringstidslinje

## Milepæle

| Fase | Periode | Status |
|------|---------|--------|
| Fase 1: Sikkerhedsaudit | Afsluttet 2026-02-15 | ✅ Færdig |
| Fase 2: Database-optimering | Afsluttet 2026-02-15 | ✅ Færdig |
| Fase 3: Performance | Afsluttet 2026-02-15 | ✅ Færdig |
| Fase 4: UI/Visuel konsistens | Afsluttet 2026-02-15 | ✅ Færdig |
| Prøveperiode | Uge 10: 2026-03-02 → 2026-03-06 | ⏳ Planlagt |
| Udrulning (1. afdeling) | Uge 12: 2026-03-16 | ⏳ Planlagt |
| Fremtidige afdelinger | Løbende efter uge 12 | 📋 Backlog |

---

## Fase 1–4: Udvikling (Færdiggjort 2026-02-15)

Alle fire udviklingsfaser er afsluttet. Se `tasks.md` for detaljerede opgaver med check-bokse.

### Opsummering

- **Sikkerhed**: Fuld RLS-audit (24 tabeller), auth-audit (11 edge functions), fjernet følsom logging
- **Database**: 8 nye indexes, 3 redundante fjernet, logs-oprydning dokumenteret
- **Performance**: 100+ console.log wrapped i DEV guard, realtime-logging reduceret
- **UI**: Hardcoded farver erstattet med tema-tokens, standardiserede tomme tilstande

---

## Prøveperiode — Uge 10 (2026-03-02 til 2026-03-06)

**Formål**: Intern test med reelle brugere fra første afdeling.

### Aktiviteter

- [ ] 3–5 testbrugere fra målafdelingen får adgang til produktionsmiljøet
- [ ] Daglig brug af planlægger, vagtplan, ferie og lager i en fuld arbejdsuge
- [ ] Fejlrapportering via dedikeret kanal (Teams/e-mail)
- [ ] Performance-monitorering (Supabase dashboard, netværks-latency)
- [ ] Feedback-indsamling fredag d. 2026-03-06

### Succeskriterier

- Ingen kritiske fejl (data-tab, auth-fejl, RLS-brud)
- Svartid < 2 sekunder for alle primære handlinger
- Positiv brugerfeedback på planlægger-workflow

---

## Udrulning — Uge 12 (2026-03-16)

**Formål**: Produktionslancering for første afdeling.

### Aktiviteter

- [ ] Endelig fejlrettelse baseret på prøveperiodens feedback
- [ ] Fuld brugeroprettelse for alle medarbejdere i afdelingen
- [ ] Kort introduktion/onboarding (15–30 min)
- [ ] Go-live med overvågning de første 48 timer
- [ ] Backup-verifikation (Supabase automatisk + custom)

### Risikomitigering

- Rollback-plan: Supabase point-in-time recovery (maks 7 dage)
- Support: Direkte kontakt til udvikler i de første 2 uger

---

## Fremtidige afdelinger (Løbende efter uge 12)

Udrulning til yderligere afdelinger sker trinvist:

1. Opret afdeling + underafdelinger i Admin-panelet
2. Opret brugere og tildel `user_access`
3. Tildel biler via `car_sub_departments`
4. Kort onboarding-session
5. Overvågning i 1 uge

**Estimeret tid per afdeling**: 2–4 timer opsætning + 1 uge overvågning.
