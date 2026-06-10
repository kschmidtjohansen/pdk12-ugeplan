## 1. Hjælpekøretøj-checkbox kan ikke vælges

**Årsag:** I `src/components/Cars/CarFormDialog.tsx` ligger de tre checkboxe (`has_trailer_hitch`, `show_in_planner`, `is_auxiliary`) i samme `flex items-center space-x-4`-række uden `flex-wrap`. Med danske labels løber rækken ud over dialogens bredde (`max-w-md`), så `is_auxiliary` bliver skubbet uden for synligt/klikbart område. Derudover bruger blokken `col-span-full`, som ikke har nogen effekt i en flex-container, hvilket bekræfter at originalt layout var tænkt som grid.

**Fix:** Omlæg de tre checkboxe til en lodret stak (eller `flex-wrap gap-3`) inde i dialogen, så `Hjælpekøretøj` altid er synlig og klikbar. Ingen ændringer til datalogik — `handleCheckboxChange('is_auxiliary', …)` er allerede korrekt forbundet via `CarsPage` → `CarDialogs` → `CarFormDialog`, og `initFormWithCar` sætter allerede `is_auxiliary` ved redigering.

## 2. Skærmvisning (`/screen-display`) skal være offentlig

**Nuværende tilstand:** Route ligger uden for `MainLayout`, så der er ingen redirect i frontend. Men data hentes via Supabase RPC `list_accessible_assignments_with_team` og tabellerne `sub_departments` + `vacations` (absences), som alle kræver autentificeret session pga. RLS — derfor "låses" siden reelt af backend.

**Plan:**

- **Database (migration):** Opret en ny SECURITY DEFINER-RPC `public.list_screen_display_assignments(p_department_id uuid, p_sub_department_id uuid, p_date date)` der returnerer KUN publicerede sager (`published = true`) for den angivne afdeling/underafdeling/dato, inkl. team-medlemmer og biler — samme shape som `list_accessible_assignments_with_team`. `GRANT EXECUTE` til `anon` og `authenticated`. Funktionen kræver `p_department_id` (returnerer tom, hvis NULL) for at undgå at lække data på tværs af afdelinger.
- Tilsvarende offentlig RPC `public.list_screen_display_absences(p_department_id uuid, p_date date)` der returnerer minimale fraværsdata (navn, type, datoer) til skærmvisning. `GRANT EXECUTE` til `anon`.
- Tilsvarende `public.list_screen_display_sub_departments(p_department_id uuid)` til rotationsfunktionen (id + navn), `GRANT EXECUTE` til `anon`.
- Ingen ændringer til RLS på tabellerne — alt sker via SECURITY DEFINER-funktioner med eksplicit `SET search_path = ''`.

- **Frontend:**
  - `src/hooks/useScreenDisplayData.ts`: kald ny RPC i stedet for `OptimizedAssignmentService` når brugeren er uautentificeret (eller altid på `/screen-display`).
  - `src/hooks/useScreenDisplayAbsences.ts`: brug den nye absences-RPC.
  - `src/pages/ScreenDisplayPage.tsx`: brug ny sub-department-RPC i rotationsblokken (linje 70).

## 3. Live opdatering + dagsskift på skærmvisning

I `src/pages/ScreenDisplayPage.tsx`:

- **Realtime:** Abonnér på Supabase realtime-kanaler for `assignments`, `assignments_employees`, `vacations` (filtreret på `department_id` hvor muligt) og kald `refetch()` ved ændringer. Eksisterende 5-min interval bevares som fallback.
- **Dagsskift ved midnat:** Tilføj `useEffect` der beregner ms til næste lokale midnat, sætter `setTimeout` → opdaterer `selectedDate` til `new Date()`, opdaterer URL via `updateUrlDate`, og gen-planlægger sig selv hver 24 t. Kun aktivt når brugeren ikke har navigeret væk fra "i dag" (eller altid — vi vælger altid for kioskbrug, så skærmen automatisk følger med).

## Tekniske detaljer

```text
Filer berørt:
  src/components/Cars/CarFormDialog.tsx        (layout for checkbox-rækken)
  src/pages/ScreenDisplayPage.tsx              (realtime + midnat + ny sub-dept RPC)
  src/hooks/useScreenDisplayData.ts            (kald ny public RPC)
  src/hooks/useScreenDisplayAbsences.ts        (kald ny public RPC)
  supabase migration                            (3 nye SECURITY DEFINER RPCs + GRANTs)
```

Ingen ændringer til eksisterende RLS-politikker; alt offentligt scope er indkapslet i SECURITY DEFINER-funktioner med streng input-validering (kræver `p_department_id`).

## Spørgsmål inden implementering

1. Skærmvisningen viser i dag også **fravær** (`absences`). Skal det også være synligt for ikke-loggede brugere? (Jeg går ud fra ja — det er en del af kioskvisningen.)
2. Skal skærmvisningen ved midnat **altid** hoppe til den nye dag (kioskadfærd), eller kun hvis brugeren stod på "i dag"?
