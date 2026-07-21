## Mål

Bring `on_call_duties` for afdeling 12 (Fredericia), `duty_type = 'kørevagt'`, uge 19–52 (2026) i overensstemmelse med den uploadede liste.

## Bekræftet nuværende tilstand

- Afdeling 12 = `8c542620-9156-4155-b686-564b14a4ca62`.
- Der findes allerede kørevagt-rækker fra 2026-05-04 og frem i `on_call_duties`. Flere dage matcher ikke listen (fx uge 19 mandag = Henrik i DB — OK, men uge 20/21 og flere efterfølgende uger afviger).
- Kørevagter opbevares som én række pr. dag pr. medarbejder — ingen periodemodel.

## Navnemapping (fra listen → profiles i afd. 12)

| Kort navn | Fuldt navn i DB |
|---|---|
| Henrik | Henrik Jørgensen |
| Mads F | Mads Fournaise |
| Julius | Julius Pedersen |
| Lars | Lars Hoeg |
| Mark | Mark Hansen |
| Nicolai | Nicolai Jørgensen |
| Ronnie | Ronnie Jensen |
| Richard | Richard Gensborg |
| Mads H | Mads Amtorp Hansen |
| Petrie | ? (ikke fundet i afd. 12 endnu) |

"Petrie" optræder i uge 21 onsdag. Jeg skal have bekræftet hvem det er før migrationen kan skrives.

## Fremgangsmåde

1. Byg fuld målliste (uge 19 mandag 2026-05-04 → uge 52 søndag 2026-12-27) fra det uploadede skema — én række pr. dag.
2. I én migration:
   - Slet alle eksisterende `kørevagt`-rækker for afd. 12 i intervallet 2026-05-04 → 2026-12-27 (scope via `employee_id IN` afd. 12-profiler samt eksterne rækker uden employee_id i samme interval).
   - Indsæt de korrekte rækker jf. skemaet med `created_by` = super admin/systembruger.
3. Verificér via `SELECT` at hver dag i intervallet nu matcher listen præcist.
4. Opdater `CHANGELOG.md` og `/docs/implementation-plan/tasks.md`.

## Åbne spørgsmål

- **Hvem er "Petrie"?** (uge 21 onsdag 2026-05-20). Fuldt navn eller profil-ID, tak — eller skal det stå som ekstern (notes = `EKSTERN: Petrie`)?
- **Bevar eksisterende skadeleder_vagt-rækker urørt?** (Jeg rører kun kørevagt).
- **Overskriv også hvis en dag allerede matcher?** (Simpleste er wipe+insert i intervallet — genererer clean state, men laver nye `created_at`/`created_by` værdier).

Når "Petrie" er afklaret, kører jeg migrationen.
