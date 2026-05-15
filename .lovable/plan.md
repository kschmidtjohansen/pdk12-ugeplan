## Mål

Forhindre at nye døde/ubrugte imports lander i `main` ved at køre lint + build automatisk på hver pull request via GitHub Actions.

## Hvad bliver tilføjet

### 1. ESLint-regel der faktisk fanger døde imports

Nuværende `eslint.config.js` har `"@typescript-eslint/no-unused-vars": "off"` — derfor fanger `npm run lint` ikke ubrugte imports i dag. Vi tilføjer `eslint-plugin-unused-imports` (devDependency) og opdaterer reglerne:

- `unused-imports/no-unused-imports: "error"` — fejler ved ubrugte `import`-statements (præcis det brugeren beder om).
- `unused-imports/no-unused-vars: "warn"` — advarer ved ubrugte variable/parametre uden at bryde build (kan strammes senere).

Det eksisterende `@typescript-eslint/no-unused-vars: "off"` bevares så vi ikke pludselig får hundredevis af fejl på legacy-kode — `unused-imports`-pluginnet håndterer specifikt imports.

### 2. Ny script-kommando

Tilføj `"lint:ci": "eslint . --max-warnings=0"` i `package.json` så CI fejler både på errors OG warnings. Lokalt kan `npm run lint` fortsat bruges uden warning-grænse.

### 3. GitHub Actions workflow

Ny fil `.github/workflows/ci.yml`:

```text
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]   # også på direkte push for safety net

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node@v4 (node 20, npm cache)
      - npm ci
      - npm run lint:ci      # fejler ved døde imports
      - npm run build        # fejler ved type-/build-fejl
```

Concurrency-gruppe pr. ref så nye pushes annullerer kørende jobs (sparer minutter).

## Hvad bliver IKKE rørt

- Ingen ændringer i applikationskode.
- Ingen rettelser af eventuelle eksisterende ubrugte imports — det vil sandsynligvis dukke op som første CI-fejl, og kan ryddes i en separat opgave.
- Ingen tests køres (projektet har ikke en konfigureret test-suite for nuværende).
- Ingen Supabase-deploy eller secrets nødvendige — workflowet kører helt uden hemmeligheder.

## Verifikation efter implementering

1. Kør `npm run lint:ci` lokalt for at se om der allerede er døde imports der vil få første PR til at fejle. Hvis ja, nævnes det i afsluttende besked så brugeren kan tage stilling til opfølgende oprydning.
2. `npm run build` skal stadig passere uændret.

## Out of scope

- Type-only check (`tsc --noEmit`) — kan tilføjes senere hvis ønsket.
- Auto-fix workflow eller pre-commit hook (husky/lint-staged).
- Branch protection rules på GitHub-siden — skal sættes manuelt af repo-owner under Settings → Branches.
