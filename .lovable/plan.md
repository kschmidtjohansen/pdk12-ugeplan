

## Fix: DAWA Autocomplete fejler pga. CORS (baade preview og produktion)

### Problem

Kald til `https://api.dataforsyningen.dk/adresser/autocomplete` fejler med "Failed to fetch" paa **alle domæner** — baade preview (`lovableproject.com`) og live (`pdk12.dk`). DAWA API'et tillader ikke cross-origin requests fra browser-klienter.

### Loesning

Opret en Supabase Edge Function som proxy. Browseren kalder vores egen backend, som videresender til DAWA API'et server-side (ingen CORS-begrænsning).

---

### Trin 1: Opret Edge Function

**`supabase/functions/dawa-proxy/index.ts`**:

- Accepterer GET-request med query-parameter `q`
- Videresender til `https://api.dataforsyningen.dk/adresser/autocomplete?q={q}&per_side=5`
- Returnerer DAWA-svaret med korrekte CORS-headers
- Returnerer tom array ved fejl (fallback)
- Ingen JWT-verifikation nødvendig (offentligt API, ingen følsom data)

**`supabase/config.toml`**: Tilfoej:

```text
[functions.dawa-proxy]
verify_jwt = false
```

---

### Trin 2: Opdater useDawaAutocomplete

**`src/hooks/useDawaAutocomplete.ts`**:

Aendr fetch fra direkte DAWA-kald til Edge Function via Supabase URL:

```text
Fra: https://api.dataforsyningen.dk/adresser/autocomplete?q={query}&per_side=5
Til:  https://cyuyrpwtkljfiqwgasmn.supabase.co/functions/v1/dawa-proxy?q={query}
```

---

### Trin 3: Dokumentation

- Opdater `docs/technical-specs/architecture.md` med info om proxy-laget
- Opdater `CHANGELOG.md`

---

### Kvalitetstjek

- Edge function logger ingen følsom data (jf. tekniske specifikationer)
- Fallback bevaret: ved proxy-fejl kan brugeren stadig taste manuelt
- Virker paa alle domæner (preview, live, localhost)

