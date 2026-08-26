# Fejl: Anni kan ikke se Asnæs-medarbejdere i vagtplanen (afd. 03)

## Hvad er årsagen

Delt vagt mellem 03 - Hillerød og 14 - Asnæs er korrekt konfigureret begge veje i `department_settings` (`shared_duty_departments`).

Selve vagterne er også synlige på tværs: adgangsreglen på vagt-tabellen indeholder allerede en klausul for delte vagtafdelinger.

Problemet ligger i medarbejder-opslaget. Vagtmodulet finder medarbejdere ved først at slå op i adgangstabellen (`user_access`) for de valgte afdelinger. Adgangsreglen på den tabel tillader kun rækker for:

- ens egen bruger,
- super admin,
- afdelinger man selv er tilknyttet.

Den kender ikke til delte vagtafdelinger. Anni er administrator i 03 - Hillerød, så hun får nul rækker retur for Asnæs, og listen over Asnæs-medarbejdere bliver derfor tom. Michael Rattenborg (administrator med tilknytning til 14 - Asnæs) får rækkerne og ser derfor listen — hvilket matcher det observerede.

Det er altså ikke cache eller browser: det er en databaseregel.

## Løsning

Udvid læse-adgangsreglen på `user_access` med én ekstra betingelse: rækker må også læses, hvis afdelingen deler vagt med en af brugerens egne afdelinger.

Det giver præcis det, der er brug for, uden at åbne mere:

- Anni kan se hvilke Asnæs-medarbejdere der kan tildeles vagt, og se deres vagter.
- Medarbejderlisten under /employees påvirkes ikke — den filtrerer selv på den valgte afdeling og viser fortsat kun egen afdeling.
- Ingen skrive-adgang ændres; kun læsning.

## Teknisk

Migration der erstatter SELECT-policyen `Users can view department access` på `public.user_access` med samme betingelser plus:

```sql
OR EXISTS (
  SELECT 1 FROM public.department_settings ds
  WHERE ds.setting_key = 'shared_duty_departments'
    AND ds.department_id = ANY (public.get_user_department_ids())
    AND ds.setting_value::jsonb ? user_access.department_id::text
)
```

Efter migrationen verificeres med en forespørgsel som Annis bruger, at Asnæs-rækker returneres.

Ingen frontend-ændringer er nødvendige — `useDutyEmployees` henter allerede både egen og delte afdelinger.

`CHANGELOG.md` opdateres med rettelsen.
