## Plan

### 1. Fjern "· Kursus" suffix i Ikke-tildelte Ressourcer
I `src/components/Planner/UnassignedResourcesSection.tsx` viser sektionen "Medarbejdere på Kursus" i dag badges som `Henrik · Kursus`. Da sektionens overskrift allerede er "Medarbejdere på Kursus", er suffixet redundant.

- Ændr badge-indholdet til kun fornavn (samme mønster som de øvrige rolle-sektioner: `emp.name.split(' ')[0]`).
- Behold den gule farve, ikon og tooltip med fuldt navn + kursustitel + slutdato.

### 2. Dashboard metric (punkt 1)
Logikken er allerede korrekt: Henriks kursus løber 11. maj – 22. juni 2026, så på 27.4.2026 (uge 18) er han ikke på kursus, og derfor figurerer han ikke i "Fraværende"-modalen for den dato. Du bekræftede, at jeg ikke skal ændre datologikken — du tester selv med en dato i kursusperioden.

- Ingen kodeændring her.

### 3. Dokumentation
- Opdatér `CHANGELOG.md` med kort note om label-rensningen.
- Opdatér `docs/implementation-plan/tasks.md` hvis relevant.

### Filer der ændres
- `src/components/Planner/UnassignedResourcesSection.tsx`
- `CHANGELOG.md`
- `docs/implementation-plan/tasks.md`
