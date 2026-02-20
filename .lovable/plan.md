
## Fix: Multi-dag opgaveoprettelse - timezone-offset og datovalideringslogik

### Problemanalyse

Der er to fejl i multi-dag oprettelsesflowet:

**Fejl 1 (Kritisk): Timezone-offset ved dato-konvertering**

I `AssignmentForm.tsx` linje 294:
```tsx
selectedDates={(formData as any).dates?.map((d: string) => new Date(d)) || ...}
```

`new Date('2026-02-25')` fortolkes som **UTC midnat** af JavaScript. På europæiske browsere (UTC+1 om vinteren) bliver dette kl. 01:00 lokal tid den 25. feb — men `format(date, 'yyyy-MM-dd')` formaterer korrekt. Det omvendte problem opstår i `AssignmentFormFields.tsx` linje ~162:

```tsx
const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
```

Dette er korrekt inde i `formatDateDisplay`, men `handleDateSelect` (linje ~171) laver lokale dates — og disse sendes korrekt videre. Problemet er, at den _omvendte vej_ (fra `formData.dates` til `selectedDates` prop) bruger `new Date(d)` uden lokal-justering.

**Fejl 2 (Validering): `formData.date` er tom-streng ved multi-dato**

Når brugeren vælger dage i kalenderen og fjerner dem igen (clearDates), sættes `date: ''`. `handleDatesChange` sætter `date: dateStrings[0]` korrekt — men submit-valideringen i `AssignmentForm.tsx` linje 82-84 tjekker kun `formData.date` og **ikke** `(formData as any).dates`:

```tsx
if (!formData.date) {  // ← Ser ikke på dates-array
  validationErrors.push(t('planner.validation.dateRequired'));
}
```

Dette er ikke det store problem (da `date` altid sættes til første valgte dato), men valideringslogikken er inkonsistent med multi-dag forventninger.

**Fejl 3 (Logik): `console.log` i produktion**

`AssignmentForm.tsx` har mange `console.log()` uden `import.meta.env.DEV`-guard — jf. tekniske specs skal disse fjernes fra produktion.

### Løsning

**`src/components/Planner/AssignmentForm.tsx`** (3 ændringer):

1. **Linje 294** — Fix timezone-offset i `selectedDates`-mapping:
   - Fra: `(formData as any).dates?.map((d: string) => new Date(d))`
   - Til: `(formData as any).dates?.map((d: string) => { const [y,m,day] = d.split('-').map(Number); return new Date(y, m-1, day); })`

2. **Linje 82-84** — Opdater datovalidering til at respektere multi-dato-arrayet:
   - Fra: `if (!formData.date) { ... }`
   - Til: `if (!formData.date && !((formData as any).dates?.length > 0)) { ... }`

3. **Console.log rydning** — Omslut alle `console.log` i `import.meta.env.DEV`-guard jf. tekniske specs (dette er en stor kodekvalitetsforbedring).

**`CHANGELOG.md`**: Dokumenter fix.

### Filer der ændres

| Fil | Ændring |
|-----|---------|
| `src/components/Planner/AssignmentForm.tsx` | Fix timezone-offset i dato-konvertering, opdater datovalidering, fjern produktions-logging |
| `CHANGELOG.md` | Dokumenter fix |

### Kvalitetstjek
- Multi-dag oprettelse virker korrekt — alle valgte dage oprettes i databasen
- Ingen timezone-offset — valgte dato-badges viser korrekte datoer
- Validering fungerer for både enkelt-dato og multi-dato
- Ingen console.log i produktion jf. tekniske specs
- Desktop og mobil understøttet
- Overholder UI-guidelines (ingen visuelle ændringer)
