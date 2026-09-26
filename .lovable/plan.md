# Faste farver ud og tydeligere sagshierarki

## 1. Faste farver skiftes til temafarver
Der ligger ca. 210 faste farver (f.eks. grøn, rød, grå, hvid) i omkring 57 ældre filer, ikke kun nogle få. De skiftes til appens egne temafarver, så mørk tilstand og nye temaer virker overalt.

Sådan oversættes de:
```text
grøn (godkendt, ledig)        -> success / success-soft
gul/orange (advarsel)         -> warning / warning-soft
rød (fejl, slet, syg)         -> destructive (+ /10 som blød baggrund)
blå/himmelblå (info, valgt)   -> primary / primary/10
grå tekst/kant/baggrund       -> muted-foreground / border / muted
hvid/sort                     -> background / foreground / card
```
Hvis der mangler en "info"-farve, tilføjes den til temaet (lys og mørk) på samme måde som success og warning.

Vi tager det i denne rækkefølge, så det der bliver brugt mest, bliver rettet først:
1. Ugeplan, Min Dag og Dashboard (opgavekort, fraværsrækker, filterchips, vælgere, statuslinje)
2. Vagtplan, Ferie, Medarbejdere og Lager
3. Administration, Profil, Notifikationer og Ændringslog
4. Login, Demo, Skærmvisning, 404

Undtagelser vi beholder: afdelingsfarver, der beregnes fra data (departmentColor), billedbeskæreren og kioskvisningen, hvor farven er et bevidst valg. De får hver en kort kommentar i koden om hvorfor.

## 2. Tydeligere hierarki på opgaven
Der findes i dag ikke et særskilt felt til skadelidtes navn. Det står typisk i titlen. Derfor bruges de felter, der allerede findes, i tre tydelige niveauer:
```text
SAG-2026-1184          lille, fast bredde, dæmpet, med #-ikon (sagsnummer)
Jens Hansen, Ribevej 4 stor og fed (titel = skadelidte/sag)
Opgavetekst ...        normal, dæmpet, højst 2 linjer (beskrivelse/adresse)
```
Det gælder for opgavekortet i ugeplanen (Standard, Kompakt og Gitter), Min Dag, Mine opgaver og sagsvinduet/bundarket. Det skal også fungere på mobil.

## Teknisk
- Ingen ændringer i databasen. Kun visning og design i index.css og tailwind.config.ts, eventuelt med en ny token `--info`.
- En fælles lille komponent `CaseHeading` (sagsnummer, titel, undertekst), så alle steder ser ens ud.
- Når vi er færdige, køres søgningen igen for at se, om der er faste farver tilbage uden for `components/ui` og de godkendte undtagelser. Mørk tilstand tjekkes med skærmbilleder af Ugeplan, Min Dag og Vagtplan.
- CHANGELOG.md og docs/ui-guidelines opdateres med reglen om farver og det nye hierarki.

Senere kan der tilføjes et rigtigt felt til skadelidtes navn. Det kræver en ændring i databasen og hører til en separat opgave.
