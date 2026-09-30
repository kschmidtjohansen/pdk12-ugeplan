# Indsæt kørevagter for afd. 06 (Holsted), uge 40–52/2026

## Baggrund
Billedet viser en ugeplan for kørevagter i afd. 06. Alle seks medarbejdere er fundet i databasen med hjemmeafdeling 06 - Holsted (`38146692-9483-40c9-9fa1-db19dec654e0`):

- Jack = Jack L L Madsen (`607b5b02-312f-48fa-be1b-a61080dc9266`)
- Peter K = Peter Kringhøj (`11089969-63eb-4c98-90ac-9b9edd0c05a3`)
- Christian = Christian Christensen (`324bc7e5-6488-4a19-a64b-bab627f4ae62`)
- Oskar = Oskar Tomasz Uller (`2b4b0417-db9b-46ee-8015-dad811924f5b`)
- Frederik = Frederik Schierenberg Jensen (`a4b03e26-ce08-420e-8f69-3d0985187368`)
- Julie = Julie Hansen (`275d8bfc-96b7-4a92-826f-e23188f7ea39`)

Der findes ingen eksisterende kørevagter for afd. 06 fra uge 40 og frem — ingen overlap.

## Ugeplan fra billedet (ISO-uger 2026)
| Uge | Mandag | Vagt |
|---|---|---|
| 40 | 28. sep | Jack |
| 41 | 5. okt | Peter K |
| 42 | 12. okt | Peter K |
| 43 | 19. okt | Christian |
| 44 | 26. okt | Oskar |
| 45 | 2. nov | Frederik |
| 46 | 9. nov | Julie |
| 47 | 16. nov | Jack |
| 48 | 23. nov | Peter K |
| 49 | 30. nov | Peter K |
| 50 | 7. dec | Christian |
| 51 | 14. dec | Oskar |
| 52 | 21. dec | Frederik |

## Udførelse
1. Én `INSERT` via run_sql: 13 uger × 7 dage (mandag–søndag) = 91 rækker i `on_call_duties` med `duty_type = 'kørevagt'`, `department_id = 06 - Holsted`, `is_demo = false`, `created_by` sat til Kasper Schmidt Johansens profil-id (oprettelsen registreres på ham som igangsætter).
2. Verifikation: optælling pr. uge/medarbejder for at bekræfte 91 rækker og korrekt fordeling.
3. Ingen kodeændringer — kun data. CHANGELOG opdateres med indsættelsen.

## Bemærkning
Uge 40 startede mandag 28. sep (i dag er 30. sep), så vagterne for 28.–29. sep indsættes også, så historikken er komplet.
