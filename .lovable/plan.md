

## Fix: Tilfoej manglende oversaettelser for lokationsstyring

### Problem
`LocationManagement.tsx` bruger oversaettelsesnoegler som `admin.locations.addPlaceholder`, `admin.locations.add`, `admin.locations.noLocations` osv., men disse noegler findes ikke i hverken `da/admin.ts` eller `en/admin.ts`. Derfor vises de raa noegler i UI'et.

### Loesning
Tilfoej en `locations`-sektion til `admin`-objektet i begge sprogfiler.

---

### Aendringer

**`src/translations/da/admin.ts`** - Tilfoej efter `tabs`-sektionen eller i bunden af admin-objektet:

```text
locations: {
  description: 'Administrer lagerlokationer for denne afdeling',
  addPlaceholder: 'Navn paa ny lokation...',
  add: 'Tilfoej',
  noLocations: 'Ingen lokationer',
  alreadyExists: 'Lokation findes allerede',
  added: 'Lokation tilfojet',
  renamed: 'Lokationsnavn opdateret',
  deleted: 'Lokation slettet',
  editName: 'Rediger navn',
  delete: 'Slet lokation',
  deleteConfirm: 'Slet lokation?',
  deleteWarning: 'Alle opbevaringer tilknyttet denne lokation vil faa deres lokation sat til ingen. Denne handling kan ikke fortrydes.'
}
```

**`src/translations/en/admin.ts`** - Tilsvarende paa engelsk:

```text
locations: {
  description: 'Manage warehouse locations for this department',
  addPlaceholder: 'Name of new location...',
  add: 'Add',
  noLocations: 'No locations',
  alreadyExists: 'Location already exists',
  added: 'Location added',
  renamed: 'Location name updated',
  deleted: 'Location deleted',
  editName: 'Edit name',
  delete: 'Delete location',
  deleteConfirm: 'Delete location?',
  deleteWarning: 'All stored items linked to this location will have their location cleared. This action cannot be undone.'
}
```

**`CHANGELOG.md`** - Dokumenter tilfoejelsen af manglende oversaettelser.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/translations/da/admin.ts` | Tilfoej `locations`-sektion med danske oversaettelser |
| `src/translations/en/admin.ts` | Tilfoej `locations`-sektion med engelske oversaettelser |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Alle noegler brugt i `LocationManagement.tsx` er daekket
- Terminologi foelger Knowledge: "Lokation" (ikke "Hall" eller "Lagerplads")
- Beskrivelsen er opdateret til at naevne "denne afdeling" for at reflektere den nye per-afdeling-isolering

