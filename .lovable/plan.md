# Del 1: Visuel oprydning af ugeplanen

Målet er en roligere og mere læsbar ugeplan: tydeligere hierarki på opgavekortene, mindre visuel støj, hurtigere genkendelse af hvem der er på opgaven, og bedre betjening på mobil.

## 1. Opgavekortet (Standard-visning)

- Klarere hierarki: sagsnummer/titel som primær linje, adresse som sekundær, tid og team som en samlet bundlinje. I dag konkurrerer titel, ansvarlig, tid, team og biler om opmærksomheden.
- Ansvarlig vises som lille navnelinje uden ikonboble, så kortet får færre farvede elementer.
- Teamet vises med initial-avatarer (farvet efter rolle) i stedet for lange navnechips; navne ses ved hover og i detaljevisningen. Op til 4 avatarer, derefter "+N".
- Lagerbadge flyttes fra svævende hjørne til bundlinjen sammen med bil og tid, så kortet ikke får indhold liggende oven på tekst.
- Ensartet kanthøjde og afstand: samme indre afstand og samme mindstehøjde på alle kort, så rækkerne flugter.
- Kladde/publiceret markeres med én markør (statusprik + tekstbadge slås sammen til ét diskret badge).

## 2. Dagsoverskrift og uge-rytme

- Dagsoverskriften får fast struktur: ugedag + dato til venstre, antal opgaver som diskret tæller, handlinger til højre.
- I dag fremhæves med et tydeligt, men roligt mærke i stedet for kun en topkant.
- Weekenddage dæmpes visuelt (lysere baggrund, dæmpet overskrift), så arbejdsugen træder frem.
- Tomme dage får én ensartet tom-tilstand i alle tre visninger.

## 3. Kompakt- og Gitter-visning

- Kompakt tabel: ensartet kolonnebredde, tabulære tal på tidspunkter, samme team-avatarer som på kortene, og handlingsknapper der altid har plads (i dag er de skjult indtil hover og kan skubbe layoutet).
- Gitter: samme korthøjde på tværs af kolonner, så rækkerne flugter.

## 4. Mobil

- Dialoger i ugeplanen (opret/redigér opgave, opgavedetaljer) åbnes som bund-sheet på små skærme i stedet for centreret dialog, med fast overskrift og rullende indhold.
- Handlingsknapper på kort er altid synlige på touch (ingen hover-afhængighed).
- Sikring af 44×44 px trykflade på alle ikonknapper i ugeplanen via den eksisterende `.touch-target`-klasse.

## Tekniske detaljer

- Filer: `src/components/Planner/AssignmentCard.tsx`, `AssignmentDetails.tsx`, `DaySection.tsx`, `CompactDaySection.tsx`, `CompactAssignmentRow.tsx`, `AssignmentStatusBadge.tsx`, `AssignmentActionButtons.tsx`, samt nye `TeamAvatars.tsx` (initialer + rollefarve) og en fælles `DayHeader`-del i `DaySection`.
- Ingen ændringer i data, rettigheder, RLS eller forretningslogik — kun præsentation.
- Alle farver via eksisterende semantiske tokens i `src/index.css` (ingen hårdkodede farveklasser; det nuværende `bg-amber-500` på lagerbadge og `bg-white dark:bg-slate-900` på dagskortet erstattes af tokens).
- Rollefarver genbruges fra `src/utils/roleColors.ts`.
- DEV-`console.log` i `AssignmentCard` og `DaySection` fjernes/dæmpes, da de kører ved hver gentegning.
- Bund-sheet på mobil løses med den eksisterende Drawer-komponent efter samme mønster som medarbejdervælgeren (Drawer på mobil, Dialog på desktop).
- Memoisering og virtualisering bevares uændret; `TeamAvatars` memoiseres.

## Verifikation

- Typecheck og lint.
- Visuel kontrol af Standard, Kompakt og Gitter på både desktop og mobilbredde.
- `CHANGELOG.md` og `docs/implementation-plan/tasks.md` opdateres.

Del 2 ("Min Dag" til teknikere / PDF-dagseddel) tages som næste opgave efter denne.
