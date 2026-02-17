
## Fix: Fejl ved biloprettelse - dobbelt fejlbesked og manglende fejlhaandtering

### Problem
Naar Michael opretter en bil i afdeling 16, sker foelgende:

1. Bilen oprettes korrekt i databasen via `CarSecurityService.createCar`
2. Derefter forsoeges synkronisering af underafdelinger (car_sub_departments) - hvis dette fejler, returnerer `createCar` false
3. `useCarFormState` ser `false`, kaster en NY fejl "Failed to create car using createCar function", som viser en ANDEN toast med den forkerte fejlbesked
4. Dialogen forbliver aaben, brugeren proever igen, og nu rammer en duplikat-constraint fordi bilen allerede blev oprettet

### Rodaarsag
To fejl i fejlhaandteringskoden:
- `useCarData.createCar` lader fejl i underafdelingssynkronisering afbryde hele operationen, selvom bilen allerede er oprettet
- `useCarFormState.handleSubmit` kaster en ny fejl naar `createCar` returnerer `false`, hvilket giver en dobbelt fejlbesked (den rigtige fejl er allerede vist)

### Loesning

**Fil 1: `src/hooks/car/useCarData.ts`**

I `createCar`-funktionen (linje 143-151): Wrap underafdelingssynkroniseringen i en try-catch saa den ikke afbryder hele operationen. Bilen er allerede oprettet, saa vi logger en advarsel men returnerer `true`.

```text
// Sync sub-department assignments via junction table
if (!isDemoMode) {
  try {
    const subDeptIds = (carData as any).sub_department_ids || [];
    if (subDeptIds.length > 0) {
      await supabase.from('car_sub_departments').insert(
        subDeptIds.map((sdId: string) => ({ car_id: data.id, sub_department_id: sdId }))
      );
    }
  } catch (syncErr) {
    if (import.meta.env.DEV) console.warn('[useCarData] Sub-department sync warning:', syncErr);
  }
}
```

**Fil 2: `src/hooks/car/useCarFormState.ts`**

I `handleSubmit` (linje 158-162): Naar `createCar` returnerer `false`, luk dialogen IKKE men kast heller ikke en ny fejl (den rigtige fejl er allerede vist via toast). Bare returner tidligt.

```text
if (createCar) {
  const success = await createCar(formData);
  if (!success) {
    return; // Fejl er allerede vist via toast i createCar
  }
}
```

**Fil 3: `CHANGELOG.md`** - Dokumenter rettelsen.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/hooks/car/useCarData.ts` | Graceful haandtering af sub-dept sync fejl |
| `src/hooks/car/useCarFormState.ts` | Fjern dobbelt fejlbesked ved mislykket oprettelse |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Bilen oprettes korrekt og vises i listen
- Underafdelingsfejl logger en advarsel men afbryder ikke oprettelsen
- Kun en enkelt fejlbesked vises (ikke dobbelt toast)
- Dialogen lukker ved succes, forbliver aaben ved reel fejl
- Ingen console.log uden DEV-guard
- Ingen hardcoded gray-farver tilfojes
