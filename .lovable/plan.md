
## Total Master Audit — Tillæg: Session-timeout (180 min) + Login-tekst

### Ændringer der skal foretages

Disse to opgaver tilføjes til den allerede godkendte Total Master Audit-plan og implementeres simultant med den.

---

### Opgave A — Session-timeout efter 180 minutters aktivitet

**Baggrund:**
Der er pt. ingen client-side timeout-mekanisme. Supabase håndterer JWT-udløb server-side (typisk 1 time), men det afbrydes ikke altid korrekt, og cachen ryddes kun ved manuel logout. Resultatet er databrud ved lang browsersession.

**Løsning:**
Tilføj en `useEffect` i `AuthProvider` (`src/context/AuthContext.tsx`) der:

1. Registrerer login-tidspunkt i `sessionStorage` (`session_start_time`)
2. Sætter en `setInterval` der løber hvert minut og tjekker om `Date.now() - session_start_time >= 180 * 60 * 1000`
3. Når de 180 minutter er nået: kalder den eksisterende `logout()`-funktion direkte — som allerede rydder TanStack Query-cache, service-caches, SessionStorage og LocalStorage korrekt
4. Viser en toast-besked om at sessionen er udløbet og at brugeren er logget ud
5. Timeren nulstilles automatisk ved ny login (`SIGNED_IN`-event)
6. Cleanup: `clearInterval` når komponenten unmountes eller brugeren logger ud

**Timeren startes** i `onAuthStateChange` når `event === 'SIGNED_IN'`, og stoppes ved `SIGNED_OUT`.

```
Eksempel på flow:
Login kl. 08:00 → session_start_time = 08:00
Kl. 11:00 (180 min) → logout() → cache ryddet → redirect til /login → toast vist
```

**Oversættelsesnøgler der tilføjes:**
- `da/auth.ts` og `en/auth.ts`: `sessionTimedOut` og `sessionTimedOutDescription`

---

### Opgave B — Ret login-sidetekster

**To steder skal rettes:**

| Fil | Nøgle | Fra | Til |
|-----|-------|-----|-----|
| `src/translations/da/login.ts` | `welcomeMessage` | `'Velkommen til Polygon Ugeplan'` | `'Velkommen til Ugeplan'` |
| `src/translations/en/login.ts` | `welcomeMessage` | `'Welcome to Polygon Weekly Planner'` | `'Welcome to Ugeplan'` |
| `src/translations/da/login.ts` | `internalSystem` | `'Internt planlægningssystem'` | `''` (tom streng) |
| `src/translations/en/login.ts` | `internalSystem` | `'Internal planning system'` | `''` (tom streng) |

**I `src/pages/LoginPage.tsx` linje 48-50:**
Linjen `{departmentName || t('login.internalSystem')}` viser kun noget, hvis `departmentName` er sat (en afdeling er valgt). Da `internalSystem`-teksten nu er tom, forsvinder underteksten fuldstændigt når ingen afdeling er valgt — præcist som ønsket. Ingen kodeændring i `LoginPage.tsx` er nødvendig.

---

### Tekniske detaljer for session-timeout

- **Kun for ikke-demo-brugere**: Demo-sessioner har kortere levetid og en separat cleanup-mekanisme — timeout springes over for `isDemoMode`
- **Ingen konflikt med Supabase JWT-refresh**: Supabase refresher tokens automatisk ved aktivitet. Den 180-minutters timer er en *app-level* timeout oven på Supabase, ikke en erstatning
- **`session_start_time` nulstilles** ved hver `SIGNED_IN`-event — så en token-refresh ikke fejlagtigt forlænger den app-level timer (vi registrerer kun det faktiske login-tidspunkt)
- **Race condition-sikring**: Timeren gemmes i en `useRef` (`sessionTimerRef`) og ryddes korrekt i cleanup-funktionen

---

### Filer der ændres (tillæg til Master Audit)

| Fil | Ændring |
|-----|---------|
| `src/context/AuthContext.tsx` | Tilføj 180-minutters session-timeout med automatisk cache-rydning |
| `src/translations/da/login.ts` | Ret `welcomeMessage` og tøm `internalSystem` |
| `src/translations/en/login.ts` | Ret `welcomeMessage` og tøm `internalSystem` |
| `src/translations/da/auth.ts` | Tilføj `sessionTimedOut`-nøgler |
| `src/translations/en/auth.ts` | Tilføj `sessionTimedOut`-nøgler |
| `CHANGELOG.md` | Dokumenter alle ændringer inkl. Master Audit |

### Kombineret implementering

Alle ændringer fra den godkendte Master Audit (DEV-guards på console.log, realtime schema-fix, EmployeeSelector-oversættelse, dokumentation) implementeres **i samme commit** som disse nye tilføjelser.

### Kvalitetstjek
- Brugere logges automatisk ud efter 180 minutter
- Cache ryddes 100% ved timeout (samme path som manuel logout)
- Login-siden viser kun "Velkommen til Ugeplan" — ingen Polygon-branding, ingen undertekst
- Demo-brugere påvirkes ikke af timeout-logikken
- Ingen konflikter med den eksisterende session-expiration-håndtering (SIGNED_OUT-event)
