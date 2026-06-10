## Problem

Servicemedarbejder (og vikar) ser kun sig selv på `/employees`, fordi RLS-policyen `secure_profile_access_unified` på `public.profiles` kun tillader SELECT for:

- ejeren selv (`id = auth.uid()`), eller
- brugere med rollen `administrator`, `skadeleder` eller `super_admin`.

Servicemedarbejdere har ingen af de roller, så Supabase returnerer kun deres egen profil. Frontend-koden (`useEmployeeData` + `EmployeesPage`) får dermed kun én række, uanset hvilken segment/visning der vælges.

## Løsning

Udvid SELECT-policyen så en autentificeret bruger også kan se kolleger der deler mindst én afdeling via `public.user_access`. Det respekterer multi-tenant-isoleringen (Core-reglen: aldrig `USING (true)`), og giver servicemedarbejdere adgang til kolleger i deres egen afdeling — men ikke på tværs af afdelinger.

### Migration (kun RLS, ingen skemaændring)

Drop og genskab `secure_profile_access_unified` på `public.profiles` med følgende logik:

```text
USING (
  id = auth.uid()
  OR public.has_role(auth.uid(), 'administrator')
  OR public.has_role(auth.uid(), 'skadeleder')
  OR public.has_role(auth.uid(), 'super_admin')
  OR EXISTS (
        SELECT 1
        FROM public.user_access me
        JOIN public.user_access them
          ON them.department_id = me.department_id
        WHERE me.user_id = auth.uid()
          AND them.user_id = profiles.id
     )
)
```

- Bruger `public.has_role(...)` (SECURITY DEFINER) for at undgå rekursion.
- Krydser `user_access` på `department_id` så kun kolleger i samme afdeling bliver synlige.
- Demo-policyen `hide_demo_data_profiles` røres ikke — demo-isolation bevares.
- Ingen ændring til `user_roles`, `profiles`-skema eller GRANTs.

### Frontend

`useEmployeeData` filtrerer i forvejen klient-side på `user_access` for den valgte afdeling og henter `user_roles`. Når RLS åbner for kolleger, vil servicemedarbejderens forespørgsel returnere alle profiler i hans afdeling, og det eksisterende filter virker uændret. Ingen kodeændringer nødvendige.

UI (`EmployeesTable`, `EmployeesPage`) skjuler allerede admin-handlinger bag `isAdmin`, så servicemedarbejdere får kun læseadgang — som ønsket.

### Dokumentation

- `CHANGELOG.md`: tilføj entry ("Servicemedarbejdere kan nu se kolleger i samme afdeling under /employees").
- `mem://features/department-system` opdateres ikke — reglen om dept-isolation overholdes stadig.

## Verifikation

1. Login som servicemedarbejder → `/employees` viser alle kolleger i den valgte afdeling, ingen handlingsknapper.
2. Login som servicemedarbejder i afdeling A → ser ikke profiler der kun har `user_access` i afdeling B.
3. Admin/skadeleder/super_admin: uændret adfærd.
4. Demo-mode: uændret (separat policy).
