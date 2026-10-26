## Fjern den lille "PolyPlan"-tekst i topbjælken

Den lille grå tekst "PolyPlan" over sidetitlen (fx "Ugeplan") i topbjælken fjernes på alle sider. Sidetitlen og ugenummeret bliver stående.

### Teknisk
- `src/components/Layout/AppTopBar.tsx`: slet `<p>{PRODUCT_NAME}</p>` (linje 72). `PRODUCT_NAME` bruges stadig til logo-linkets aria-label.
- CHANGELOG opdateres. Ingen publicering.
