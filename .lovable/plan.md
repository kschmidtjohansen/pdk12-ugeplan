

## Fix: Lokationer skal starte tomme per afdeling

### Problem
`LocationManagement` har en hardcoded `defaultLocations`-liste med "Hal 1" og "Sort Hal" der ALTID vises. localStorage-scopingen skjuler kun tilpasninger, men standard-lokationerne vises i alle afdelinger. For Afd. 16 skal der ikke vises noget, da ingen lokationer er oprettet der.

### Loesning
Aendr arkitekturen saa lokationer gemmes HELT i localStorage per afdeling. Ingen hardcodede defaults. Hver afdeling starter med en tom liste, og lokationer tilfojes eksplicit via en "Tilfoej lokation"-knap.

---

### Aendringer i `src/components/Admin/LocationManagement.tsx`

1. **Fjern hardcoded `defaultLocations`-array** (linje med hal_1 og sort_hal)

2. **Gem lokationer i localStorage per afdeling** som en fuld liste i stedet for kun "tilpasninger ovenpaa defaults":
```text
// localStorage struktur per afdeling:
{
  locations: [
    { key: "hal_1", label: "Hal 1" },
    { key: "sort_hal", label: "Sort Hal" }
  ]
}
```

3. **Tilfoej "Tilfoej lokation"-knap** med et input-felt saa brugeren kan oprette lokationer specifikt for den aktive afdeling.

4. **Bevar rename og slet funktionalitet** - de arbejder nu direkte paa den gemte liste.

5. **Migration**: For afdeling 12 - Fredericia (eller andre der allerede bruger lokationer), hvis der IKKE findes data under den nye noegle, kan man valgfrit pre-populate med defaults. Alternativt starter alle afdelinger tomt og brugeren tilfojer manuelt.

### Ny UI-flow
- Afdeling uden lokationer: Viser "Ingen lokationer" + "Tilfoej lokation"-knap
- Afdeling med lokationer: Viser listen med rename/slet som nu + "Tilfoej lokation"-knap

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/components/Admin/LocationManagement.tsx` | Fjern hardcoded defaults, tilfoej lokation-CRUD fra localStorage, tilfoej "Tilfoej lokation"-knap |
| `CHANGELOG.md` | Dokumenter aendringen |

### Kvalitetstjek
- Afd. 16 viser ingen lokationer (tom liste)
- Afd. 12 kan faa sine lokationer tilbagefoert manuelt via "Tilfoej lokation"
- Sletning fjerner lokationen permanent fra listen for den afdeling
- Ingen pavirkning paa andre afdelinger
