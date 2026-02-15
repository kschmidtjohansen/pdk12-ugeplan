

## Fase 9b: Demo-bruger afdelingsadgang

### Nuvaerende datatilstand

| Data | Dept 12 - Fredericia | Dept 02 - Storkoebenhavn |
|------|---------------------|-------------------------|
| Opgaver | 1.023 (sub_dept: null) | 2 |
| Biler | 12 | 1 |
| Lager | 22 | 0 |
| Underafdelinger | Ingen | 3 (Fugt & Skimmel, Loesoere, Miljoe & Brand) |
| Demo-bruger adgang | Ja (17 user_access raekker) | Nej |

### Hvad der skal goeres

Opgaven er udelukkende en **database-aendring**: Tilfoej 3 raekker i `user_access` saa demo-brugeren ogsaa faar adgang til dept 02 med dens underafdelinger.

Naar brugeren skifter til dept 02, vil filtreringslogikken i `DepartmentContext` og `unifiedDataService` automatisk kun vise data bundet til dept 02 — dvs. naesten ingenting. Alle 1.023 opgaver, 12 biler og 22 lageremner forbliver isoleret paa dept 12 og vises KUN naar dept 12 er valgt.

**Ingen kodeaendringer er noedvendige.** Filtreringen virker allerede korrekt via `department_id`-parameteren.

### Database INSERT

3 nye raekker i `user_access`:

```text
user_id:        165cdbc9-6722-4c96-97d2-1a87185c8133 (demo-bruger)
department_id:  de10b9d0-bd39-4c20-81d8-a12719beb53b (02 - Storkoebenhavn)

Sub-department IDs:
  - 5931531c-0bb0-4e97-b5dd-03283ee1865c  (Fugt & Skimmel)
  - 8a63e216-388e-4f83-a19c-623c1f5352ed  (Loesoere)
  - 21bf50af-6a84-4bea-853a-ddbe15f9a54f  (Miljoe & Brand)
```

### Dokumentation (jf. Knowledge-instruks)

| Fil | Handling |
|-----|---------|
| `CHANGELOG.md` | Tilfoej entry: "Demo-bruger faar adgang til 02 - Storkoebenhavn med 3 underafdelinger. Eksisterende data forbliver isoleret paa 12 - Fredericia." |
| `docs/implementation-plan/tasks.md` | Tilfoej Fase 9b markeret [x] |

### Kvalitetstjek

- Ingen skema-aendringer — kun data-INSERT i eksisterende tabel
- Overholder tekniske specifikationer (ingen nye kolonner/tabeller)
- Ingen foelsom logging tilfojet
- UI-guidelines upaavirkede
- Eksisterende data paa dept 12 forbliver 100% uaendret og usynligt ved dept 02-visning

