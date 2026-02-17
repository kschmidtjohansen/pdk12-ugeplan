
## Fjern duplikat-validering på brændstofkortkoder

### Baggrund

I den forrige implementering blev der tilfojet en duplikat-advarsel, som blokkerede for at gemme en bil, hvis dens `fuel_card_code` allerede var i brug af en anden bil. Dette er en ugyldig forretningsregel: i Afdeling 14 (Asnaes) er det intentionelt at alle biler deler samme kortkode.

### Aendringer

#### 1. `src/components/Cars/CarFormDialog.tsx`

Fjern tre ting:

- `AlertTriangle`-importen (linje 16) — bruges kun til advarselsikonet
- `isDuplicateFuelCode`-beregningen (linje 51-58) — hele logikken fjernes
- Roed border-styling pa `fuel_card_code`-input (linje 122)
- Advarselsbesked-blokken under inputfeltet (linje 124-129)
- `isDuplicateFuelCode ||` fra `disabled`-betingelsen pa Gem-knappen (linje 252-253)

Resultatet er et simpelt, uvalideret fritekstfelt for brændstofkortkoden — praecis som feltet var designet.

Da `cars` og `currentCar` props nu udelukkende tjente duplikat-tjekket, fjernes de ogsa fra interfacet og komponenten for at holde koden ren.

#### 2. `src/components/Cars/CarDialogs.tsx`

Fjern `cars` og `currentCar` fra de props der videresendes til `CarFormDialog` (da de ikke laengere bruges der). `currentCar` bruges dog stadig til `isEditing={!!currentCar}` og `DeleteConfirmDialog`, sa den prop BEVARES pa `CarDialogs` — men sendes ikke laengere videre som `currentCar`-prop til `CarFormDialog`.

#### 3. `CHANGELOG.md`

Dokumenter at duplikat-valideringen er fjernet med begrundelsen at delte brændstofkortkoder er en gyldig forretningsregel.

### Filer der aendres

| Fil | Aendring |
|-----|---------|
| `src/components/Cars/CarFormDialog.tsx` | Fjern isDuplicateFuelCode-logik, advarsel og AlertTriangle-import |
| `src/components/Cars/CarDialogs.tsx` | Fjern cars-prop videregivelse til CarFormDialog |
| `CHANGELOG.md` | Dokumenter aendringen |

### Kvalitetstjek

- Brændstofkortkoder kan vaere identiske pa tvaers af alle biler i en afdeling
- Gem-knappen er ikke laengere blokeret af kortkode-validering
- Den kritiske fix fra forrige plan (department_id bevares ved opdatering) pavirkes ikke
- Ingen regressioner i resten af bilformularen
