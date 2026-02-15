
## Opret docs-mappestruktur

### Hvad der oprettes

```text
docs/
  implementation-plan/
    readme.md        -- Formaal: Aktive opgaver og faser
    tasks.md         -- De 4 faser (Sikkerhed, Database, Performance, UI)
  product-roadmap/
    readme.md        -- Formaal: Langsigtet vision, afdelinger, udrulning
  technical-specs/
    readme.md        -- Formaal: Database-arkitektur, SHA256, RLS-politikker
  ui-guidelines/
    readme.md        -- Formaal: Visuelle standarder, visninger, responsivitet
```

### Indhold i hver readme.md

**implementation-plan/readme.md**: Beskriver mappen som projektets opgavestyring. Refererer til tasks.md for aktive og afsluttede opgaver.

**implementation-plan/tasks.md**: Indeholder de 4 gennemfoerte faser fra vores samtaler:
1. Sikkerhedsaudit (RLS, edge functions, logging)
2. Database-optimering (indexes, redundans, logs-oprydning)
3. Performance (console.log guards, font-subsetting, caching)
4. UI/Visuel konsistens (tema-variabler, tomme tilstande, polish)

Alle opgaver markeres som faerdige (`[x]`) da de er implementeret.

**product-roadmap/readme.md**: Beskriver den langsigtede vision, herunder understoettelse af flere afdelinger/underafdelinger, feature toggles per afdeling, og fremtidig udrulning.

**technical-specs/readme.md**: Beskriver regler for database-arkitektur (RLS-politikker, junction-tabeller, SHA256-kryptering via Supabase Auth), sikkerhedsstandarder og logging-politikker.

**ui-guidelines/readme.md**: Beskriver de visuelle standarder: tema-variabler (ingen hardcoded farver), Standard/Kompakt/Gitter-visning, responsivt design, tomme tilstande og hover-effekter.

### Changelog

Tilfoej en ny sektion i CHANGELOG.md:
```
### Added - 2026-02-15
- Oprettet docs/ mappestruktur som projektets Single Source of Truth
- docs/implementation-plan/ med tasks.md (4 faser: Sikkerhed, Database, Performance, UI)
- docs/product-roadmap/ med readme.md (langsigtet vision)
- docs/technical-specs/ med readme.md (database og sikkerhedsstandarder)
- docs/ui-guidelines/ med readme.md (visuelle standarder og visninger)
```

### Filer der oprettes (6 nye filer) og redigeres (1 fil)

| Fil | Handling |
|-----|---------|
| `docs/implementation-plan/readme.md` | Opret |
| `docs/implementation-plan/tasks.md` | Opret |
| `docs/product-roadmap/readme.md` | Opret |
| `docs/technical-specs/readme.md` | Opret |
| `docs/ui-guidelines/readme.md` | Opret |
| `CHANGELOG.md` | Opdater |
