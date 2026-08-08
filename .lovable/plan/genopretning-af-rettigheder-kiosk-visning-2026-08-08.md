# Genopretning af rettigheder + kiosk-visning

## Hovedårsag (verificeret)

Da databasens sikkerhedsadvarsler blev udbedret, blev `EXECUTE`-rettigheden fjernet fra stort set alle databasefunktioner. Konkret måling i den nuværende database:

- 121 funktioner i alt — kun 16 af dem kan kaldes af indloggede brugere (`authenticated`) eller af kiosk-visningen (`anon`).
- Det rammer også hjælpefunktioner som `is_super_admin`, `get_user_department_ids`, `is_admin_user`, `get_auth_uid` — de bruges *inde i* adgangsreglerne (RLS) på tabellerne. Når funktionen ikke må køres, fejler hele forespørgslen med en rettighedsfejl.

Det forklarer punkt 1 og 2 samlet:
- Kasper Johansen har faktisk rollerne `super_admin`, `administrator`, `skadeleder`, `fugttekniker` i databasen. Appen kan bare ikke læse/anvende dem, fordi rolle- og adgangsopslagene fejler — appen falder derfor tilbage til "servicemedarbejder" og viser fejl.
- Kioskvisningen (`/screen-display`) bruger `list_screen_display_assignments`, `list_screen_display_absences` og `list_screen_display_sub_departments`. Ingen af dem må køres af `anon` længere → tom skærm/fejl.

## Hvad der bliver lavet

### 1. Rettigheder (database-migration)
- Giv `EXECUTE` tilbage til `authenticated` og `service_role` på alle app-funktioner i `public`.
- Giv `EXECUTE` til `anon` udelukkende på de tre kiosk-funktioner (ingen andre) — kiosken skal virke uden login, men intet andet åbnes.
- Sæt standardrettigheder for fremtidige funktioner, så problemet ikke opstår igen ved næste migration.
- Ingen ændring af RLS-politikker: dataadgangen forbliver præcis som i dag, den kan bare fungere igen.

Verifikation: efter migrationen tælles funktioner uden `EXECUTE` (skal være 0 for `authenticated`), og der køres et opslag som en almindelig bruger og som super_admin for at bekræfte, at profil, roller og afdelinger hentes.

### 2. Kioskvisning
- Tabellen `assignments_employees` mangler i realtidspublikationen, så kiosken opdager ikke, når personer tilføjes/fjernes fra en opgave. Tilføjes til realtid.
- Kioskens realtidslytning udvides til også at reagere på biler (`cars`), vagter (`on_call_duties`) og kursus (`trainings`), så visningen opdateres ved alle relevante ændringer.
- Døgnskifte: den eksisterende midnats-timer bevares, men suppleres med et minut-ur, der tjekker om datoen er skiftet. TV-skærme uden fokus/synlighedsevents får derfor stadig automatisk næste dag. Datoen i URL'en opdateres samtidig.
- Fejlbilledet i kiosken får automatisk genforsøg i stedet for kun manuel knap.

### 3. 360-graders gennemgang
Efter rettighederne er genoprettet, gennemgås systematisk:
- Alle `supabase.rpc(...)`-kald i koden holdes op mod de funktioner, der faktisk findes i databasen (finder kald til fjernede/omdøbte funktioner).
- Adgangsregler pr. rolle: super_admin, administrator, skadeleder, fugttekniker, servicemedarbejder, vikar — kontrol af at hver rolle kan læse det, den skal, på de centrale sider (dashboard, planlægning, medarbejdere, biler, vagtplan, oversigt, admin).
- Kontrol af at ingen tabel er utilgængelig for indloggede brugere (`logs`-tabellerne er bevidst lukkede og forbliver det).
- Sikkerhedsscanner + database-linter køres til sidst, så vi ikke genindfører de advarsler, der oprindeligt blev ryddet op i.
- Fund samles i en liste; kritiske fejl rettes med det samme, resten rapporteres til dig.

Dokumentation og `CHANGELOG.md` opdateres til sidst.

## Teknisk resumé

- Migration: `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role` + `ALTER DEFAULT PRIVILEGES`, plus målrettet `GRANT EXECUTE` til `anon` på de tre `list_screen_display_*`-funktioner. `SECURITY DEFINER`-funktioner beholder deres `SET search_path`.
- Frontend: `src/pages/ScreenDisplayPage.tsx` (realtidskanaler + dato-ur), `src/components/ScreenDisplay/ScreenDisplayErrorBoundary.tsx` (auto-retry).
- Realtid: `ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments_employees;` (+ `REPLICA IDENTITY FULL`).
- Ingen ændringer i `AuthContext`s rollelogik — den er korrekt; den fejlede kun pga. manglende funktionsrettigheder.
