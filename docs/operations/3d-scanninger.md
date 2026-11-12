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

## Arkiv

- **Arkivér** flytter en rundvisning til Arkiv (feltet `archAt` i tour-dokumentet). Den kan gendannes i 3 dage (`KEEP_DAYS` i siden).
- **Sletning:** efter 3 dage slettes rundvisningen med scener, billeder og links. Det sker i browseren, næste gang en bruger med redaktøradgang åbner oversigten. Der kører intet job på serveren.
- **Slet nu** findes kun på arkiverede rundvisninger.

## Gulvringe på nye rundvisninger

- En scene uden forbindelser viser automatiske ringe til næste og forrige scene (foran og bag startretningen). De er ikke gemt i databasen.
- Når en redaktør trækker eller åbner en automatisk ring, bliver den en almindelig, gemt forbindelse.
- "Forbind scenerne automatisk" (AI, `p360-ai`) lægger ringe, der peger den rigtige vej.

## 3D-scan fra telefon (LiDAR)

- **Sådan:** scan med en LiDAR-app på iPhone Pro/iPad Pro (fx Scaniverse eller Polycam), eksportér som **GLB**, og vælg filen under Tilføj billeder → "Vælg 3D-scan (.glb)".
- **Hvorfor en app:** Safari på iPhone giver ikke hjemmesider adgang til LiDAR-sensoren.
- **Lagring:** filen gemmes i bucket `p360` som `.glb` (scene med `kind: 'model'`). Projektets filgrænse i Supabase gælder (Storage → Settings).
- **Visning:** 3D, Plan (set ovenfra med snit) og Mål i meter. Mål gemmes i `measures3`.
- **Deling:** virker i links til forsikringen (`p360-link` signerer filen). Er ikke med i "Fil til forsikring".
- **Ikke understøttet:** Draco-/meshopt-komprimeret GLB, USDZ, OBJ, PLY, punktskyer og splats.

## Plantegning fra LiDAR-scan

- **Sådan:**
  1. Scan hver etage med en LiDAR-app, fx Polycam Room/LiDAR eller Scaniverse, og eksportér som GLB.
  2. Tilføj billeder → "Vælg 3D-scan (.glb)".
  3. Plantegning → "Fra 3D-scan" → "Lav plantegning".
- **Resultat:** gemmes i `tour.plan.scans[sceneId]` = `{ level, cut, walls (polylinjer i m), rooms [{x, y, area, w, h, box}], bbox }`. Visningen bruger `plan.mode = 'scan'`.
- **Billeder:** et 360-billedes position på tegningen er `scene.spot = {x, y, rot}`.
- **Ringe:** "Lav ringe ud fra plantegningen" laver ringe med `by: 'plan'` og erstatter AI-ringe mellem placerede billeder. Ringe, man selv har sat, bliver stående. Mangler et billede retning, findes den ud fra de gamle ringe, når det er muligt.
- **Nøjagtighed:** testet på en syntetisk scanning af et hus på 6,86 × 6,65 m med rum ned til ca. 5 % fra de rigtige m². Stuer og køkkener med åben forbindelse bliver ét rum.


## Præcise hjørner fra 360-billeder

Dette findes i "Ret hjørner".

- **Lup:** når man trækker et hjørne, viser en lup billedet forstørret 5×, så hjørnet kan sættes på den præcise pixel.
- **Ovenfra-billede:** panelet viser gulvet (eller loftet) set ovenfra i målestok, med rummets omrids. Lige vægge ser lige ud, så skæve hjørner er nemme at se.
- **Gulv/Loft:** er gulvet dækket af møbler, kan hjørnerne i stedet sættes, hvor væggene møder loftet. Det kræver rumhøjden (`scene.roomHeight`, ellers `tour.roomHeight`, ellers 2,50 m).
- **Find kanterne:** `P360.snapOutline` finder vægge ved gulv og loft. Hver væg tilpasses som en ret linje gennem mange kantpunkter, og hjørnerne bliver, hvor nabovæggene krydser hinanden.
  - Vægge, der ses både ved gulv og loft, giver også rumhøjden.
  - Vægge uden tydelig kant bliver stående, og man får besked om, hvilke vægge der skal rettes i hånden.
  - Under "Ret hjørnerne nu?" efter AI-plantegningen køres det automatisk én gang pr. rum (±15 cm omkring AI's gæt).
- **Kendt mål:** man vælger en væg og skriver dens rigtige længde i cm. Kamerahøjden (`tour.camHeight`) rettes, så alle rum i sagen får samme skala.
  - Det gemmes som `tour.calib = { len, scene, at }`.
  - Ændrer man kamerahøjden i hånden, fjernes kalibreringen.
- **Nøjagtighed:** panelet viser ± pr. rum: billedets pixelstørrelse på gulvet ved det fjerneste hjørne plus skalausikkerhed. Den er 3 % uden kendt mål og 0,4 % med.
  - Et billede på 5760 px med kendt mål giver ca. ±1–2 cm på vægge op til 3 m.
  - Et billede på 2576 px giver det dobbelte.
- **Begrænsning:** på testbillederne ("Test") fandt "Find kanterne" kun en del af væggene automatisk, fordi gulvkanterne var skjult af møbler, og cremefarvede vægge mødte et cremefarvet loft. Resten skal sættes med luppen.
  - Der er endnu ingen sammenlægning af flere billeder fra samme rum.

## Ét rum i flere billeder

- **Hvad:** er et rum fotograferet fra flere steder, samler "Saml billeder (n)" i "Ret hjørner" dem. Det sker også automatisk, når man trykker "Færdig" efter hjørnegennemgangen.
- **Hvilke billeder hører til samme rum:**
  - billeder på samme etage, hvis kameraposition ligger inde i rummets omrids;
  - eller billeder, hvis eget omrids har midten inde i det (`roomGroup`).
- **Sådan virker det** (`P360.fuseRoom`):
  1. Væggene findes i hvert billede med "Find kanterne".
  2. Hvert ekstra billede bliver placeret præcist (drejning og position) ud fra de vægge, det deler med hovedbilledet. Startpunktet er placeringen fra ringene.
  3. Hver væg bliver et vægtet gennemsnit af alle tydelige observationer. Nære, skarpe billeder vægter mest. Er billederne uenige, bliver usikkerheden større.
  4. Hjørnerne bliver, hvor væggene krydser hinanden.
- **Gemmes:**
  - Hovedbilledet får `scene.fused = { with, seen, err, at }`.
  - De andre får `scene.roomOf` (hovedbilledets id) og `scene.roomRel` (placering i forhold til hovedbilledet, som "Placér alle" bevarer).
  - Alle billeder får samme omrids.
  - Plantegningen tegner rummet én gang med en nål pr. billede, og CSV'en skriver "Samme rum som …" i stedet for at tælle arealet to gange.
- **Testet:**
  - Syntetiske rum: med 2–3 billeder, der deler mindst to vægge, er hjørnerne 1–3,5 cm fra de rigtige. Deler de næsten ingen vægge, er det 5–12 cm, og den viste ± afspejler det.
  - Browsertest: et syntetisk møbleret rum på 4,03 × 3,20 m. Rummet blev målt til 4,01 × 3,21 m ud fra to billeder, med AI-hjørner op til 12 cm ved siden af og billede 2 placeret 35 cm / 6° forkert. Billede 2 endte 1,6 cm fra sin rigtige plads.
- **Afprøvet på de rigtige billeder fra "Test"** (mod Floorfys mål):
  - Badeværelset (2,08 × 1,52 m) blev 2,05 × 1,63–1,70 m. Hvert billede fandt kun én tydelig væg, så billederne kunne ikke samles.
  - Soveværelset: loftkanterne blev fundet, men målene hoppede 10–20 % efter startgættet.
  - Konklusion: på rodede, dunkle billeder i 2576 px når den automatiske del ikke få cm. Hjørnerne skal sættes med luppen, og ét kendt mål skal indtastes.
- **Rettet efter afprøvningen:** vægge, der kun ses ved loftet, bruges ikke længere sammen med gulvvægge, når loftafstanden er gættet. Det kunne før bøje rummet: badeværelsets dybde sprang fra 1,70 til 2,11 m. Er det kun loftkanterne, der ses, beholdes formen, og appen siger, at størrelsen er et skøn.
- **Begrænsning:**
  - Loftkanten forudsætter et fladt loft. I rum med skråt loft (fx stuen i "Test") må man stole på gulvkanterne.
  - Det er ikke afprøvet mod Floorfys mål på de rigtige billeder.

## Plantegningsmodel (trænet på Polygons egne rum)

- **Hvorfor egen model:** de offentlige modeller til 360-billeder (HorizonNet, LGT-Net m.fl.) er trænet på datasæt, der kun må bruges til ikke-kommerciel forskning. Derfor træner vi vores egen med samme opbygning (MIT-kode).
  - Træningssættet ligger i `tools/layout-model/`. Se README dér.
- **Træningsdata:**
  - "Rummet passer" i "Ret hjørner" gemmer `scene.layoutOk`. Det fjernes igen, hvis et hjørne flyttes.
  - `export_polyplan.py` henter de bekræftede rum.
  - Rumhøjden skal være kendt (`scene.roomHeight` eller `tour.roomHeight`).
- **Model i brug:** administratorer uploader `layout.int8.onnx` under Indstillinger → Plantegningsmodel.
  - Filen gemmes i bucket `p360`, og `p360_config.doc.layoutModel = { id, name, size, at }`.
  - Modellen kører i browseren med ONNX Runtime Web 1.20.1, som hentes fra jsDelivr, kun når der er en model.
- **Når der er en model:**
  - "Ringe og plan automatisk" sætter hjørnerne med modellen i stedet for AI's gæt. `outlineBy = 'model'`, rumhøjden måles, og vægliner gemmes i `scene.modelLines`.
  - "Find rummet" gør det samme for ét billede.
  - "Saml billeder" bruger modellens vægge, når de findes.
- **Testet:**
  - Hele kæden i browseren (upload → hent ONNX Runtime → kør → hjørner → bekræft) er testet med en testmodel, der returnerer det rigtige svar for et syntetisk rum på 4,03 × 3,20 m. Resultat: 4,03 × 3,20 m og rumhøjde 2,50 m.
  - Træning, ONNX-eksport og kørsel i ONNX Runtime Web er afprøvet med en minimal træning på CPU. En ResNet18-model kører på ca. 1,5 s pr. billede i én tråd.
- **Status:** der er ingen trænet model endnu. Det kræver bekræftede rum og en GPU. Indtil da bruges AI-hjørnerne og "Find kanterne" som før.

## Flere billeder i samme rum giver ét rum

- **Automatisk:** "Ringe og plan automatisk" grupperer billederne efter rum, når ringe og placering er lavet (`roomClusters`). To billeder er samme rum, når:
  - AI'en har sagt det: `same_room` fra p360-ai's link-svar, gemt som `scene.ai.same[id]`. Har AI'en sagt "forskellige rum", vinder det altid, også over hele grupper.
  - eller hvert kamera står mindst 35 cm inde i det andet billedes rum;
  - eller det ene gør, og AI'en har kaldt begge rum det samme (fx "Stue").
- **Hovedbillede:** det billede, hvis rum er størst.
  - Billederne bliver samlet med "Saml billeder", så vægge set i flere billeder bliver præcise.
  - Kan et billedes vægge ikke matches, kommer det alligevel med i rummet på sin ring-placering. Rummet tegnes aldrig to gange.
- **Rumgennemgang og plan:**
  - "Ret hjørnerne nu?" viser kun ét billede pr. rum.
  - Plantegningen tegner rummet én gang med en nål pr. billede.
  - Rumoversigt og CSV viser én række med indholdet fra alle billederne, samme genstand talt én gang (højeste antal), og "Samlet fra N billeder".
- **p360-ai:** link-prompten spørger nu også om `same_room`. Version 2 er deployet 12-11-2026. Kildekoden ligger i `supabase/staged/functions/p360-ai/`.
- **Forskellige rumtyper:** har AI'en kaldt de to rum noget forskelligt (fx Køkken og Stue), forbliver de to rum, medmindre AI'en har set begge billeder og sagt "samme rum".
- **Testet:**
  - To billeder af ét syntetisk rum plus et køkken. Resultat: 2 rum, 3 nåle, rumgennemgang "1 af 2", og stuens indhold talt én gang.
  - Den eksisterende test med 3 forskellige rum giver stadig 3 rum.

## Ringe til alle steder og trapper

- **Ringe til alle billeder i rummet:** "Ringe og plan automatisk" og "Færdig" efter hjørnegennemgangen laver ringe ud fra plantegningen (`planRings`, `by: 'plan'`). Man er ikke længere låst til billedernes rækkefølge.
  - Der kommer en ring til hvert andet billede i samme rum, på dets stativplads.
  - Der kommer en ring gennem hver dør eller åbning, AI'en har set, til billedet i rummet bag den, når rummene støder op til hinanden (højst 60 cm imellem).
  - Ringene laves om hver gang. Ringe, en person har sat, røres aldrig.
  - Ringene bruges ikke til at placere billederne (`autoPlace` springer `by: 'plan'` over).
- **Trapper:** en forbindelse til et billede på en anden etage vises som et orange trappeskilt "Op til 1. sal" / "Ned til stueetagen" i stedet for en gulvring.
  - Ser AI'en en trappe op (ned), forbindes billedet til et billede på etagen over (under), helst ét med trappe den anden vej, ellers det nærmeste i rækkefølgen.
  - Skiltet sidder ved trappen, AI'en så.
- **Testet:** 3 billeder i én stue plus et loft. Stuen blev ét rum med ringe mellem alle tre billeder, "Op til 1. sal" ved trappen, og klik førte op og "Ned til stueetagen" tilbage.

## Forbind automatisk (uden plantegning)

- **Standard nu:** plantegning ud fra 360-billeder er slået fra. Den kom ikke tæt nok på Floorfys plan for "Test".
  - Knappen hedder "Forbind automatisk".
  - Den laver rumanalyse (navn, etage, indhold, trapper), samler billeder af samme rum, laver ringe og trapper og viser ingen plantegning. `tour.plan.mode = 'none'`.
  - Plantegningen kommer i stedet fra LiDAR eller et uploadet billede (fx Encircle) under Plantegning → Billede.
  - Indstillinger → "Lav plantegning ud fra 360-billederne (eksperimentel)" slår den gamle opførsel til igen (`config.planFrom360`).
- **Gå frit rundt:** ud over billederne i rækkefølge sammenligner AI'en alle par på samme etage (højst 120 par, nærmeste i rækkefølgen først).
  - Der laves ringe, når AI'en siger, at man kan gå direkte derhen: `visible`, dvs. samme rum eller lige gennem en dør eller åbning, eller når det er samme rum.
  - Svarene gemmes i `scene.ai.vis`. Par, der allerede er spurgt om, spørges ikke igen.
- **Placering:** ringen trækkes ind på gulvet i rummet, så den ikke står i en væg. AI'ens rigtige punkt for stativet gemmes i `hotspot.spot` og bruges til at placere billederne. Før blev de presset sammen på 1–2 m.
- **Trapper i hele rummet:** ser blot ét billede i et rum trappen, får alle billeder i rummet skiltet "Op til 1. sal" i trappens retning.
- **Indstillinger:** `planFrom360` og `layoutModel` indlæses nu fra databasen. Før blev ukendte nøgler sprunget over ved genindlæsning.
- **p360-ai version 3** (spørger om `visible`) er deployet 12-11-2026. Kildekoden ligger i `supabase/staged/functions/p360-ai/`.
