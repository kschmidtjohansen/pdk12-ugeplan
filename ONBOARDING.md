# Onboarding-vejledning — PDK12 Ugeplan

> **Målgruppe:** IT-kollegaer og supportmedarbejdere, der skal opsætte systemet og vejlede brugere.

---

## Indholdsfortegnelse

1. [Introduktion](#1-introduktion)
2. [Roller og adgangsniveauer](#2-roller-og-adgangsniveauer)
3. [Første login](#3-første-login)
4. [Opret hovedafdeling (by)](#4-opret-hovedafdeling-by)
5. [Opret underafdelinger](#5-opret-underafdelinger)
6. [Feature toggles](#6-feature-toggles)
7. [Opret lokationer (lager)](#7-opret-lokationer-lager)
8. [Opret brugere](#8-opret-brugere)
9. [Rediger og slet brugere](#9-rediger-og-slet-brugere)
10. [Opret vikarer](#10-opret-vikarer)
11. [Feriestyring](#11-feriestyring)
12. [Vagtplan](#12-vagtplan)
13. [Planlægger](#13-planlægger)
14. [Biler](#14-biler)
15. [Lager](#15-lager)
16. [Fejlsøgning / FAQ](#16-fejlsøgning--faq)

---

## 1. Introduktion

PDK12 Ugeplan er et planlægnings- og ressourcestyringssystem til daglig drift. Systemet håndterer:

- **Opgavefordeling** via en visuel planlægger
- **Vagtplaner** med tildelinger og byttemuligheder
- **Ferie- og fraværsstyring** med godkendelsesflow
- **Bilflåde** og **lagerstyring** per afdeling
- **Brugerstyring** med rollebaseret adgangskontrol

Systemet er opdelt i **hovedafdelinger** (byer) og **underafdelinger** (teams/enheder). Hver hovedafdeling kan have sine egne moduler aktiveret.

---

## 2. Roller og adgangsniveauer

Systemet har 5 roller med stigende adgangsniveau:

| Rolle | Hvem | Kan | Kan ikke |
|-------|------|-----|----------|
| **Super Admin** | IT-ansvarlig / IT-support | Alt i alle afdelinger. Oprette afdelinger, feature toggles, brugerstyring, se brændstofkoder. | – |
| **Administrator** | Afdelingschef / Afdelingsleder / Driftsansvarlig | Alt inden for egne afdelinger. Godkende ferie, oprette opgaver, brugerstyring. | Oprette nye afdelinger, ændre feature toggles. |
| **Skadeleder** | Skadeleder/Projektleder | Oprette og redigere opgaver, tildele medarbejdere/biler, administrere vagtplan, se brændstofkoder. | Godkende ferie, oprette brugere. |
| **Servicemedarbejder** | Tekniker / Servicemedarbejder | Se egne opgaver, ansøge om ferie, se vagtplan (kun visning), redigere egen profil. | Oprette/redigere opgaver, se brændstofkoder, administrere biler/lager. |
| **Vikar** | Midlertidig medarbejder | Samme som Servicemedarbejder, men med udløbsdato. | Samme begrænsninger som Servicemedarbejder. |

> **Vigtigt:** Roller gemmes i en separat `user_roles`-tabel og kontrolleres via server-side sikkerhedsfunktioner (RLS). Roller kan **aldrig** ændres fra browseren — kun via Admin-panelet af en Super Admin eller Administrator.

### Adgangsmatrix — moduler

| Modul | Super Admin | Administrator | Skadeleder | Servicemedarbejder |
|-------|:-----------:|:------------:|:----------:|:-----------------:|
| Planlægger (se) | ✅ | ✅ | ✅ | ✅ (kun egne) |
| Planlægger (rediger) | ✅ | ✅ | ✅ | ❌ |
| Ferie (ansøg) | ✅ | ✅ | ✅ | ✅ |
| Ferie (godkend) | ✅ | ✅ | ❌ | ❌ |
| Vagtplan (rediger) | ✅ | ✅ | ✅ | ❌ |
| Biler | ✅ | ✅ | ✅ | ❌ |
| Lager | ✅ | ✅ | ✅ | ❌ |
| Brugerstyring | ✅ | ✅ (egen afd.) | ❌ | ❌ |
| Feature toggles | ✅ | ❌ | ❌ | ❌ |
| Afdelingsstyring | ✅ | ❌ | ❌ | ❌ |

---

## 3. Første login

### For IT-administratoren

1. Åbn systemet via den udleverede URL.
2. Log ind med de credentials, der er oprettet ved initial opsætning.
3. Du lander på **Dashboard**-siden.

### For nye brugere

1. Brugeren modtager sine loginoplysninger fra sin IT-kontakt (e-mail + midlertidig adgangskode).
2. Åbn systemet og indtast e-mail og adgangskode på login-siden.
3. **Anbefaling:** Skift adgangskode ved første login via **Profil → Skift adgangskode**.

### Adgangskodekrav

- Minimum 8 tegn.
- Anbefalet: Brug en blanding af store/små bogstaver, tal og specialtegn.

---

## 4. Opret hovedafdeling (by)

> **Kræver rolle:** Super Admin

Hovedafdelinger repræsenterer byer eller overordnede enheder. Al data i systemet (opgaver, biler, lager, brugere) er knyttet til en hovedafdeling.

### Trin-for-trin

1. Gå til **Admin** (i topmenuen).
2. Vælg fanen **Afdelinger**.
3. Indtast byens navn i feltet "Bynavn".
4. Klik **Opret by**.
5. Den nye afdeling vises nu i listen.

### Rediger eller slet

- **Omdøb:** Klik på blyant-ikonet ud for afdelingens navn, ret navnet, og gem.
- **Slet:** Klik på slet-ikonet. **Advarsel:** Alle underafdelinger og brugertildelinger for denne by slettes også.

---

## 5. Opret underafdelinger

> **Kræver rolle:** Super Admin eller Administrator

Underafdelinger er teams eller enheder under en hovedafdeling (f.eks. "Team Nord", "Kontor", "Lager").

### Trin-for-trin

1. Gå til **Admin → Underafdelinger**.
2. Vælg den ønskede **hovedafdeling** i dropdown-menuen øverst.
3. Indtast navnet på underafdelingen.
4. Klik **Opret underafdeling**.

### Vigtige detaljer

- En bruger kan tilknyttes flere underafdelinger.
- Underafdelinger bruges til at filtrere data i planlæggeren, vagtplanen og lageret.
- Sletning af en underafdeling fjerner brugertildelinger til den, men sletter ikke brugerne.

---

## 6. Feature toggles

> **Kræver rolle:** Super Admin

Hvert modul kan slås til/fra per hovedafdeling. Dette styrer, hvilke menupunkter og funktioner der er synlige for brugerne i den pågældende afdeling.

### Trin-for-trin

1. Gå til **Admin → Funktioner**.
2. Vælg den ønskede **hovedafdeling** i dropdown-menuen.
3. Slå de ønskede moduler til eller fra med switch-knapperne:

| Modul | Hvad det styrer |
|-------|----------------|
| **Lager** | Adgang til lagerstyring og lokationer |
| **Vagt** | Adgang til vagtplanlægning |
| **Vikar** | Mulighed for at oprette vikarer med udløbsdato |
| **Chat / Beskeder** | Chat-funktion på opgaver i planlæggeren |
| **Fil-upload** | Mulighed for at uploade filer til opgaver |

### Bemærkninger

- Ændringer i **Chat** og **Fil-upload** træder i kraft øjeblikkeligt (sektionerne forsvinder/vises).
- Ændringer i **Lager**, **Vagt** og **Vikar** kræver en genindlæsning af siden.
- Deaktivering af et modul fjerner **ikke** eksisterende data — det skjuler kun adgangen.

---

## 7. Opret lokationer (lager)

> **Kræver rolle:** Super Admin eller Administrator

Lokationer bruges til at kategorisere lagervarer (f.eks. "Hal 1", "Sort Hal", "Kontor"). Hver afdeling har sine egne lokationer.

### Trin-for-trin

1. Gå til **Admin → Lokationer**.
2. Vælg den ønskede **hovedafdeling** i dropdown-menuen.
3. Indtast lokationens navn i feltet (f.eks. "Hal 1").
4. Klik **Tilføj**.
5. Lokationen vises nu i listen og kan vælges i lagerformularen.

### Rediger eller slet

- **Omdøb:** Klik på blyant-ikonet, ret navnet, og gem.
- **Slet:** Klik på slet-ikonet. Lagervarer, der var knyttet til denne lokation, får lokationen sat til "Ingen".

### Automatisk gendannelse

Hvis en afdeling har eksisterende lagervarer med hal-værdier, men ingen konfigurerede lokationer, vil systemet automatisk vise de eksisterende hal-værdier som lokationer. Det anbefales dog at oprette lokationerne eksplicit via Admin-panelet.

---

## 8. Opret brugere

> **Kræver rolle:** Super Admin eller Administrator

### Trin-for-trin

1. Gå til **Admin → Brugere**.
2. Klik **Opret bruger** (knappen øverst til højre).
3. Udfyld formularen:

| Felt | Beskrivelse | Påkrævet |
|------|-------------|:--------:|
| **Fulde navn** | Brugerens for- og efternavn | ✅ |
| **E-mail** | Login-e-mail (skal være unik) | ✅ |
| **Adgangskode** | Midlertidig adgangskode (min. 8 tegn) | ✅ |
| **Rolle** | Vælg én af de 5 roller | ✅ |
| **Telefon** | Mobilnummer | Valgfrit |
| **Stilling** | Jobtitel (f.eks. "Skadeleder", "Projektleder", "Skadeleder/Fugttekniker", "Servicemedarbejder") | Valgfrit |
| **Hovedafdeling** | Hvilken by/afdeling brugeren tilhører | ✅ |
| **Underafdelinger** | Hvilke teams brugeren har adgang til | Valgfrit |

4. Klik **Gem**.
5. Del loginoplysningerne med brugeren (e-mail + adgangskode).

### Vigtige detaljer

- Brugeren kan tilknyttes **flere underafdelinger** (multi-select).
- Rollen bestemmer, hvad brugeren kan se og gøre (se [Roller og adgangsniveauer](#2-roller-og-adgangsniveauer)).
- E-mailen bruges som login og kan ikke ændres efter oprettelse.

### Opret IT-support / Super Admin uden afdeling

Hvis du opretter en bruger til IT-support, der ikke tilhører en driftsafdeling:

1. Vælg rollen **Super Admin** i formularen.
2. En ny mulighed dukker op: **"Uden afdeling (IT-support)"** — sæt flueben her.
3. Brugeren oprettes uden tilknytning til nogen afdeling eller underafdeling.
4. Brugeren har stadig fuld adgang til alle afdelinger via sin Super Admin-rolle.

> **Bemærk:** Checkboxen "Uden afdeling" vises kun, når rollen **Super Admin** er valgt. Den er automatisk aktiveret ved valg af Super Admin, men kan slås fra, hvis brugeren alligevel skal tilknyttes en afdeling.

---

## 9. Rediger og slet brugere

> **Kræver rolle:** Super Admin eller Administrator

### Rediger bruger

1. Gå til **Admin → Brugere**.
2. Find brugeren i listen (brug evt. afdelingsfilter).
3. Klik på **redigér-ikonet** (blyant) på brugerens række.
4. Ret de ønskede felter og klik **Gem**.

### Nulstil adgangskode

1. Klik på **nøgle-ikonet** på brugerens række.
2. Indtast den nye adgangskode (min. 8 tegn).
3. Bekræft adgangskoden og klik **Nulstil**.
4. Del den nye adgangskode med brugeren.

### Deaktiver bruger

1. Klik på **status-ikonet** på brugerens række.
2. Bekræft deaktivering. Brugeren kan herefter ikke logge ind.
3. Brugeren kan genaktiveres på samme måde.

### Slet bruger

1. Klik på **slet-ikonet** (skraldespand) på brugerens række.
2. Bekræft sletning. **Denne handling kan ikke fortrydes.**
3. Brugerens data (profil, roller, adgange) fjernes permanent.

---

## 10. Opret vikarer

> **Kræver rolle:** Super Admin eller Administrator  
> **Kræver:** Feature toggle "Vikar" er aktiveret for afdelingen

Vikarer er midlertidige brugere med en udløbsdato. Når datoen passeres, deaktiveres brugeren automatisk.

### Trin-for-trin

1. Følg den normale brugeroprettelse (se [Opret brugere](#8-opret-brugere)).
2. Vælg rollen **Vikar**.
3. Sæt en **udløbsdato** i det ekstra felt, der vises.

### Regler for udløbsdato

- Udløbsdatoen **kan ikke** sættes i fortiden.
- Systemet viser en **advarsel**, hvis udløbsdatoen er mere end 6 måneder frem.
- Når datoen passeres, kører en automatisk oprydning, der deaktiverer brugerens login og markerer profilen.

---

## 11. Feriestyring

### For medarbejdere (alle roller)

1. Gå til **Ferie** i topmenuen.
2. Klik **Anmod om ferie**.
3. Udfyld formularen:
   - **Type:** Ferie, Sygdom, Afspadsering, Barnets sygedag, Andet.
   - **Startdato** og **Slutdato** (eller markér "Samme dag").
   - **Tidspunkter** (valgfrit, til delvis fravær).
   - **Bemærkninger** (valgfrit).
4. Klik **Send anmodning**.
5. Anmodningen får status **Afventer** og vises i din ferieliste.

### For godkendere (Administrator og Super Admin)

1. Gå til **Ferie**.
2. Se anmodninger med status **Afventer** i listen.
3. Klik på en anmodning for at se detaljer.
4. Vælg **Godkend** eller **Afvis**.
5. Medarbejderen modtager en notifikation om beslutningen.

### Feriekalender-oversigt

- Gå til **Admin → Ferieoversigt** for at se alle godkendte ferier i en kalendervisning.
- Oversigten viser antal tilgængelige vs. fraværende medarbejdere per uge.

---

## 12. Vagtplan

> **Kræver:** Feature toggle "Vagt" er aktiveret for afdelingen  
> **Redigering kræver:** Super Admin, Administrator eller Skadeleder

### Opret vagt

1. Gå til **Vagtplan** i topmenuen.
2. Klik på en dato i kalenderen eller klik **Opret vagt**.
3. Udfyld formularen:
   - **Dato** for vagten.
   - **Vagttype** (f.eks. dagvagt, nattevagt, weekendvagt).
   - **Medarbejder** — vælg fra listen af tilgængelige medarbejdere.
   - **Bemærkninger** (valgfrit).
4. Klik **Gem**.

### Byt vagt

1. Klik på en eksisterende vagt.
2. Vælg **Byt vagt**.
3. Vælg den medarbejder, der skal overtage vagten.
4. Begge parter modtager en notifikation.

### Visning

- **Kalendervisning:** Oversigt over vagter per måned.
- **Listevisning:** Detaljeret liste med filter.
- Servicemedarbejdere kan kun **se** vagtplanen — ikke redigere den.

---

## 13. Planlægger

> **Redigering kræver:** Super Admin, Administrator eller Skadeleder  
> **Visning:** Alle roller (Servicemedarbejdere ser kun egne opgaver)

Planlæggeren er systemets kerne — her fordeles daglige opgaver.

### Opret opgave

1. Gå til **Planlægger** i topmenuen.
2. Klik **Opret opgave** (plus-ikon).
3. Udfyld formularen:

| Felt | Beskrivelse |
|------|-------------|
| **Titel** | Kort beskrivelse af opgaven |
| **Dato** | Hvilken dag opgaven skal udføres |
| **Tidsrum** | Fra-tid og til-tid |
| **Adresse** | Arbejdsstedets adresse (med automatisk adresseforslag) |
| **Sagsnummer** | Valgfrit reference-nummer |
| **Type** | Opgavetype (f.eks. besigtigelse, udbedring) |
| **Beskrivelse** | Detaljeret beskrivelse |
| **Medarbejdere** | Tildel én eller flere medarbejdere |
| **Biler** | Tildel én eller flere biler |
| **Ansvarlig** | Hvem der er ansvarlig for opgaven |

4. Klik **Gem**.

### Publicering

- Nye opgaver er som standard **ikke publicerede**.
- Publicér opgaver, så servicemedarbejdere kan se dem på deres dashboard.
- Brug auto-publicering eller publicér manuelt.

### Chat og filer (hvis aktiveret)

- Åbn en opgave og brug **Chat**-fanen til at kommunikere om opgaven.
- Brug **Filer**-fanen til at uploade dokumenter, billeder eller PDF'er.

---

## 14. Biler

> **Kræver:** Super Admin, Administrator eller Skadeleder

### Opret bil

1. Gå til **Biler** i topmenuen.
2. Klik **Opret bil**.
3. Udfyld formularen:

| Felt | Beskrivelse |
|------|-------------|
| **Navn** | Bilens kaldenavn (f.eks. "Hvid Sprinter") |
| **Bilnummer** | Internt nummer |
| **Nummerplade** | Registreringsnummer |
| **Brændstofkortkode** | Kun synlig for Admin+ |
| **Totalvægt** | I kg (valgfrit) |
| **Trækkrog** | Har bilen anhængertræk? |
| **Træk m/bremser** | Tilladt trækevægt med bremser |
| **Træk u/bremser** | Tilladt trækevægt uden bremser |
| **Vis i planlægger** | Skal bilen kunne tildeles opgaver? |
| **Bemærkninger** | Valgfrit |

4. Klik **Gem**.

### Tilgængelighed

- Markér en bil som **utilgængelig** (f.eks. til værksted) med årsag og forventet returdato.
- Markér den som **tilgængelig** igen, når den er klar.

### Brændstofkortkoder

Brændstofkortkoder er **kun synlige** for Super Admin, Administrator og Skadeleder. Servicemedarbejdere kan aldrig se disse.

---

## 15. Lager

> **Kræver:** Feature toggle "Lager" er aktiveret for afdelingen  
> **Redigering kræver:** Super Admin, Administrator eller Skadeleder

### Opret lagervare

1. Gå til **Lager** i topmenuen.
2. Klik **Opret vare**.
3. Udfyld formularen:

| Felt | Beskrivelse |
|------|-------------|
| **Adresse** | Kundens/skadens adresse |
| **Sagsnummer** | Valgfrit reference-nummer |
| **Lokation** | Vælg hal/lokation fra dropdown (se [Opret lokationer](#7-opret-lokationer-lager)) |
| **Antal** | Antal enheder |
| **Rengjort** | Status: Ja / Nej / Delvist |
| **Bemærkninger** | Valgfrit |

4. Klik **Gem**.

### Filtrering

- Lagervarer filtreres automatisk efter den valgte afdeling.
- Brug søgefeltet til at finde specifikke varer.

---

## 16. Fejlsøgning / FAQ

### "Brugeren kan ikke logge ind"

1. Tjek om brugeren er **aktiv** under Admin → Brugere (status-kolonnen).
2. Tjek om brugerens e-mail er stavet korrekt.
3. Nulstil adgangskoden via Admin → Brugere → nøgle-ikonet.
4. Hvis brugeren er vikar: Tjek om udløbsdatoen er passeret.

### "Brugeren kan ikke se menupunktet Lager/Vagt"

1. Tjek om det relevante modul er **aktiveret** under Admin → Funktioner for brugerens afdeling.
2. Tjek om brugeren har den rigtige **rolle** (Servicemedarbejdere har ikke adgang til Lager/Biler).

### "Lokationer vises ikke i lagerformularen"

1. Gå til Admin → Lokationer og kontrollér, at lokationer er oprettet for den valgte afdeling.
2. Systemet falder automatisk tilbage til eksisterende hal-værdier fra lagervarer, men det anbefales at oprette lokationer eksplicit.

### "Brugeren ser ikke sine opgaver"

1. Tjek om opgaverne er **publiceret** i planlæggeren.
2. Tjek om brugeren er **tildelt** opgaverne (medarbejder-feltet).
3. Tjek om brugeren er i den rigtige **afdeling/underafdeling**.

### "Ferieanmodning forsvandt"

1. Tjek om anmodningen er blevet **afvist** af en administrator (status vises i ferielisten).
2. Godkendte ferier, der er udløbet, ryddes automatisk op af systemet.

### "Vagtplan er tom"

1. Tjek om feature toggle "Vagt" er aktiveret for afdelingen.
2. Tjek om der er oprettet vagter for den valgte periode.
3. Tjek om den valgte afdeling/underafdeling har medarbejdere tildelt.

### "Bil vises ikke i planlæggeren"

1. Tjek om feltet **"Vis i planlægger"** er aktiveret på bilen.
2. Tjek om bilen er markeret som **tilgængelig**.
3. Tjek om bilen er tilknyttet den rigtige afdeling.

---

## Opsætningsrækkefølge (anbefalet)

Når du opretter en ny afdeling fra bunden, følg denne rækkefølge:

```
1. Opret hovedafdeling (by)
2. Opret underafdelinger
3. Aktivér feature toggles
4. Opret lokationer (hvis lager er aktiveret)
5. Opret biler
6. Opret brugere og tildel roller + afdelinger
7. Opret opgaver i planlæggeren
```

---

*Sidst opdateret: 12. marts 2026*
