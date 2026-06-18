## Mål
Når ingen underafdeling er valgt på en bil, skal bilen automatisk gemmes under **alle** afdelingens underafdelinger (i stedet for ingen). Sikrer også at gem-knappen virker uden valg.

## Ændringer

**`src/components/Cars/CarFormDialog.tsx`**
- Importér `useDepartment` (allerede gjort) og udvid submit: før `onSubmit(e)` kaldes, hvis `formData.sub_department_ids` er tom og `userSubDepartments.length > 0`, fyld `setFormData` med alle `userSubDepartments.map(s => s.id)`. 
- Da setState er asynkron, er den enkleste løsning: wrap `onSubmit` i en lokal `handleSubmitWrapper` der bygger en udvidet `formData` og kalder `onSubmit` direkte, men da onSubmit læser formData via lukning i `useCarFormState`, skal vi sætte state først og kalde onSubmit i et `useEffect`-mønster — for at undgå dette flytter vi logikken til `useCarFormState.handleSubmit`.

**Foretrukken løsning — `src/hooks/car/useCarFormState.ts`**
- Tilføj `userSubDepartments` via `useDepartment()` context i hook'en.
- I `handleSubmit`, lige efter `e.preventDefault()`: hvis `(formData.sub_department_ids || []).length === 0` og `userSubDepartments.length > 0`, byg `effectiveFormData = { ...formData, sub_department_ids: userSubDepartments.map(s => s.id) }`. Brug `effectiveFormData` videre i stedet for `formData` til både `createCar`, `updateCar` og `syncSubDepartments`-kald.

**UI hint — `src/components/Cars/CarFormDialog.tsx`**
- Tilføj en lille gråtonet hjælpetekst under underafdeling-checkboxene: "Hvis ingen vælges, gemmes bilen under alle underafdelinger." (dansk) / engelsk pendant. Tilføj nye nøgler i `src/translations/{da,en}/cars.ts`.

## Dokumentation
- `CHANGELOG.md`: Note om "tom underafdeling = alle".
- `docs/implementation-plan/tasks.md`: Marker som fuldført.

Ingen DB- eller RLS-ændringer.