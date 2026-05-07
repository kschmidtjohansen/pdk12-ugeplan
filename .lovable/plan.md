## Plan: Genimport af skadeledervagt (uge 19–44, 2026)

Den tidligere import havde fejl i 7. maj og 8.–10. maj. Jeg har nu genlæst billedet uge for uge og verificeret bl.a. at uge 19 = Sune/Nick/Kasper/Sonny/Kasper/Kasper/Kasper, så Sonny har 7. maj og Kasper har 8.–10. maj.

### Hvad der sker
1. Sletter alle eksisterende `skadeleder_vagt` for afdeling 12 i datointervallet **2026-05-04 til 2026-11-01**.
2. Indsætter 182 nye rækker for uge 19–44 (Morten springes over som tidligere aftalt).
3. Brugere bliver linket korrekt: Kasper Johansen og Nick Berg Hansen. Eksterne navne (Sander, Sune, John, Bo, Vibse, Sonny) gemmes som `EKSTERN: Fornavn Efternavn [INI]` så de vises både i kalender og listevisning.

### Berørte data
- Tabel: `on_call_duties`, kun `duty_type='skadeleder_vagt'` og `department_id` = afdeling 12 - Fredericia
- Tidligere ugers vagter (uge 1–18) røres ikke

### Verificering før kørsel
- 2026-05-07: EKSTERN Sonny Brodersen ✓
- 2026-05-08, 09, 10: Kasper Johansen ✓
- Uge 19 mandag (4. maj): EKSTERN Sune Torp Dissing ✓

Klik godkend for at køre migrationen.