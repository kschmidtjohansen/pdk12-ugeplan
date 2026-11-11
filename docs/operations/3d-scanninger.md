# 3D-scanninger (Polygon 360-rundvisninger)

Status: **STAGED – den del, der rører databasen, er ikke live.** Siden ligger i `public/3d/index.html` og
bliver publiceret med appen. Den viser kun login, indtil SQL'en nedenfor er kørt. Menupunktet
"3D-scanninger" i sidemenuen er skjult, indtil SQL'en er kørt og brugeren har adgang.

## Hvad er det

- 360-rundvisninger fra GoPro MAX-optagelser. Rundvisningerne er inddelt i afdelinger og har status.
- Medarbejdere kan dele en rundvisning med forsikringsselskabet som et link, der kun kan vises.
- Siden er én selvstændig HTML-fil uden byggetrin, så den rører ikke React-appen.
- Den bruger den samme Supabase-klientversion (2.112.4) og den samme session som PolyPlan. "Husk mig" gælder også her.
- **Login:** samme konto som i PolyPlan. Siden har ingen kontooprettelse. "Glemt adgangskode" sender videre til `/login`.

## Adgang

Adgangen følger rollerne i `user_roles`, som kun bliver læst, aldrig ændret. Standardoversættelsen er:

| PolyPlan-rolle | 3D-adgang |
|---|---|
| super_admin, administrator | Administrator (indstillinger, afdelinger, brugere) |
| skadeleder, fugttekniker | Redaktør (oprette, rette, dele) |
| servicemedarbejder | Læser |
| vikar | Ingen |

- Oversættelsen kan ændres på 3D-siden under Indstillinger → Roller fra PolyPlan.
- Enkelte personer kan få en højere rolle direkte. Den højeste rolle gælder.
- Profiler med status `inactive`/`terminated`, profiler med en udløbet `expires_at` og demo-profiler (`is_demo`) har aldrig adgang. super_admin har det altid.
- Forsikringslinks bruger Edge Function `p360-link`. Den slår kun linkets token op og returnerer tidsbegrænsede billed-URL'er (12 t). Den træffer ingen rollebeslutninger.

## Filer

- `public/3d/index.html`: appen. Den bygges i Polygon 360-projektet og kopieres hertil; ret den ikke i hånden.
- `src/hooks/useScanAccess.ts` (+ test): skjuler eller viser menupunktet via `p360_role()`. Den læser kun.
- `src/components/Layout/AppSidebar.tsx`: menupunktet.
- `supabase/staged/sql/002_polygon_360.sql`:
  - Nye tabeller `p360_*`, nye funktioner `p360_*`, RLS på alle nye tabeller.
  - En privat bucket `p360` og storage-policies, der kun gælder den bucket.
  - Én transaktion. Kan køres igen.
- `supabase/staged/sql/002_polygon_360_rollback.sql`: fjerner det hele igen.
- `supabase/staged/functions/p360-link/index.ts`: linkfunktionen. Den ligger under staged og bliver derfor ikke auto-deployet.

## Sådan sættes det live

1. **Backup.** Tag en backup (Supabase → Database → Backups).
2. **Kør SQL'en.** I Supabase → SQL Editor: kør `002_polygon_360.sql`. Det sidste resultat skal vise `user_roles`.
3. **Deploy linkfunktionen.** I Supabase → Edge Functions → Deploy new function:
   - Navn `p360-link`, indhold fra `supabase/staged/functions/p360-link/index.ts`.
   - Slå **"Enforce JWT verification" fra**. Funktionen skal kunne kaldes af forsikringsselskaber uden login; den kræver i stedet et ukendeligt token på 24 tegn.
4. **Test.** Log ind i PolyPlan som administrator. Menupunktet "3D-scanninger" vises. Tjek Indstillinger → Roller fra PolyPlan.
5. **Flyt eksisterende rundvisninger.** På den gamle Claude-side: Del → Fil til forsikring. Brug derefter Importér på 3D-siden.

## Fortryd

Kør `002_polygon_360_rollback.sql`. Tøm og slet derefter bucket'en `p360` under Storage, og slet funktionen `p360-link`.
Menupunktet forsvinder af sig selv. Fjern `public/3d/` for at fjerne siden helt.

## Automatisk plantegning (AI)

- **Hvor:** Redigér → Plantegning → Automatisk → "Lav plantegning automatisk". Kun redaktører kan bruge den.
- **Hvad AI gør:**
  - Rumanalyse pr. billede: rumtype, gulvhjørner, indhold, trapper og etage. Kun hvis scenen ikke allerede er analyseret, og eksisterende omrids overskrives ikke.
  - Én analyse pr. par af billeder i optagerækkefølge, der lægger gulvringe begge veje, hvis de mangler.
  - Bagefter placeres rummene ud fra ringene.
- **Funktion:** `supabase/functions/p360-ai`, udrulles af Lovable ved merge (`verify_jwt = true`). Den kalder `p360_can_edit()` med brugerens JWT og bruger `LOVABLE_API_KEY`. Model: secret `P360_AI_MODEL`, ellers `openai/gpt-6-astra`.
- **Nøjagtighed:** mål, hjørner og ringe er forslag. Ret dem i 360-visningen ("Tegn igen", træk ringen) og i plantegningen ("Placér ud fra ringene").
- **Kildekode:** `public/3d/index.html` bygges uden for repoet. Lovables direkte ændringer i filen flettes ind ved hver ny version, og `#p3-bundle` genopbygges som gyldig JSON.
