## Opgave

To dele:

### 1. Fix bug i listevisning (Vagt)
I `src/components/Duty/DutyList.tsx` tjekker `getDisplayName()` `!duty.employee_id` FØR den tjekker `EKSTERN:`-noten. Eksterne vagter har ingen `employee_id`, så de vises som "Ledig vagt" i stedet for det indtastede navn.

**Fix:** Byt rækkefølgen så `EKSTERN:`-tjekket kommer først (samme rækkefølge bruges allerede korrekt i `DutyMonthCalendar.tsx`).

### 2. Importér skadeledervagter for afdeling 12 - Fredericia

Navne mappes:
- **Brugere:** Nick → Nick Berg Hansen, Kasper → Kasper Johansen
- **Eksterne (gemmes som `EKSTERN: Navn [INI]` i `notes`, employee_id = NULL):**
  - Sander → Jesper Sander Mortensen [JSM]
  - Sune → Sune Torp Dissing [STD]
  - John → John Sørensen [JS]
  - Bo → Bo Mathiesen [BM]
  - Vibse → Vibeke Van Sanden [VVS]
  - Sonny → Sonny Brodersen [SB]
- **"Morten":** springes over (ledig vagt) jf. dit svar.

Eksisterende `skadeleder_vagt`-rækker i Fredericia inden for importperioden slettes først for at undgå dubletter.

### Manglende information

Det uploadede billede viser kun **uge 1-44** ("Side 1"). Jeg har brug for at vide:

1. **Hvilket år?** (Kørevagten dækkede uge 19-52 i 2026 — er det samme år her?)
2. **Hvilke uger?** Skal jeg kun importere uge 1-44, eller har du en side 2 med uge 45-52 du kan uploade?

Når du bekræfter år + evt. uploader resten, kører jeg migrationen og laver kode-fixet.
