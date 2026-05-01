## Mål
1. Forenkle venstre brand-panel på `/login` (desktop): mindre tekst, hvid headline, strammere hierarki.
2. Gøre mesh-baggrunden tydeligt mere levende — større bevægelse, blød skala-pulse og længere drift-baner — uden at distrahere fra login.

Ingen ændringer i mobil-banner, login-form, logo eller funktionalitet.

---

## Del A — Tekst & hierarki i venstre panel
Fil: `src/pages/LoginPage.tsx` (kun `<aside>`-blokken).

### Headline i hvid + kortere
- Tilføj eksplicit `text-white drop-shadow-sm` på `<h2>`.
- DA: "Planlæg ugen — ét samlet overblik."
- EN: "Plan the week — one shared view."

### Fjern lang beskrivelses-paragraf
- Slet `<p>`'en under headline ("Polygon Ugeplan samler opgaver…"). Headline + 3 feature-kort står stærkere alene.

### Forkort feature-kort tekst
- Ugeplan — DA: "Opgaver pr. dag og uge." / EN: "Tasks per day and week."
- Vagter & ferie — DA: "Vagtplan og fravær samlet." / EN: "Duty and absence in one view."
- Adgang pr. afdeling — DA: "Isoleret pr. afdeling og rolle." / EN: "Isolated per department and role."

### Strammere spacing
- Headline-blok: `space-y-8` → `space-y-6`.
- Feature-liste: `space-y-2.5` → `space-y-2`.

### Bundtekst
- "Kontakt jeres administrator for adgang." bevares uændret.

---

## Del B — Mere levende mesh-animation
Filer: `tailwind.config.ts` (keyframes/animation) og `src/pages/LoginPage.tsx` (klasser/inline-styles på de 3 mesh-blobs).

### Nye / opdaterede keyframes i `tailwind.config.ts`
Tilføj tre nye keyframes med større translate-radius, rotation og skala-pulse, så blobs'ene faktisk bevæger sig synligt rundt i panelet:

```text
mesh-float-1: 0% translate(0,0) scale(1) → 33% translate(12%,8%) scale(1.15) →
              66% translate(-8%,14%) scale(0.95) → 100% translate(0,0) scale(1)

mesh-float-2: 0% translate(0,0) scale(1) → 50% translate(-14%,-10%) scale(1.2) →
              100% translate(0,0) scale(1)

mesh-float-3: 0% translate(0,0) scale(1) → 40% translate(10%,-12%) scale(1.1) →
              80% translate(-6%,6%) scale(1.25) → 100% translate(0,0) scale(1)
```

Animation-bindinger (langsomme, bløde — ikke distraherende):
- `animate-mesh-float-1`: `mesh-float-1 18s ease-in-out infinite`
- `animate-mesh-float-2`: `mesh-float-2 22s ease-in-out infinite`
- `animate-mesh-float-3`: `mesh-float-3 26s ease-in-out infinite`

De gamle `mesh-drift` / `mesh-drift-alt` bevares (bruges evt. andre steder), men erstattes på login-blobsene.

### Brug i `MeshBackground` (`LoginPage.tsx`)
- Blob 1: erstat `animate-mesh-drift` → `animate-mesh-float-1`, `opacity-70` → `opacity-80`, `blur-3xl` → `blur-[100px]`.
- Blob 2: erstat `animate-mesh-drift-alt` → `animate-mesh-float-2`, `opacity-60` → `opacity-70`.
- Blob 3: erstat `animate-mesh-drift` → `animate-mesh-float-3`, fjern `animationDelay: '-6s'` (ikke nødvendigt — keyframes har egne faseforskydninger), `opacity-50` → `opacity-65`.
- Tilføj `will-change: transform` via inline-style på de 3 blobs for jævn GPU-rendering.

### Reduced motion
- Wrap blobs så de respekterer `motion-reduce:animate-none` (Tailwind utility) — så brugere med "reducer bevægelse" får statisk mesh.

---

## Hvad ændres IKKE
- Mobil top-banner bruger samme `MeshBackground` → får automatisk den mere levende animation (ønsket bivirkning, samme visuelle sprog).
- Login-form, logo, ikoner, farver, layout-grid — uændret.
- Ingen translation-filer, DB-, RLS- eller funktions-ændringer.

## Verifikation
- Desktop ≥1024px: roligere panel, hvid headline, mindre tekst; mesh bevæger sig synligt over ~20s cyklus.
- Mobil: banner får samme livlige mesh.
- `prefers-reduced-motion`: mesh står stille.
- Login-flow uændret.

## Dokumentation
- `CHANGELOG.md`: "Login: forenklet venstre brand-panel og mere levende mesh-baggrund."