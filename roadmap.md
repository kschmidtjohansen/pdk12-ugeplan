# PolyPlan v1.4.1
## Bil 25 i Hillerøds Alle
- [x] Ret sortering af BIL-præfiks i biloversigt og bilvalg; kontrollér afdeling og uændret værkstedsperiode med regressionstests.
- [ ] Kontrol med brugerens rigtige login — ekstern unmanaged Supabase-session kan ikke injiceres.
## EasySignage preview
- [x] Diagnose the editor address returning HTTP 401; generate published screen links and keep token-only external framing.
- [ ] Verify department 12 in the user's EasySignage player — requires the user's player access and published changes.
## 3D login regression
- [x] Reproduce and prevent embedded 3D URL normalization from redirecting the viewer on reload; add regression tests.
- [ ] Verify access with the requesting user's real session — external unmanaged Supabase has no injectable session.
## Login presentation
- [x] Full Cult/Magic-inspired login polish with unchanged authentication and reduced-motion support.
- [x] Public login at 1280px/390px, light/dark, password visibility, empty-field validation, mobile installation help and reduced-motion checks.
## Vacation approval permissions
- [x] Remove automatic skadeleder approval in UI/actions and enforce status changes server-side; retain explicit grants and administrator access.
- [x] Regression tests, live rule inspection and documentation: 282 tests, lint and preview build OK.
- [ ] Authenticated approval E2E — external unmanaged Supabase session unavailable.
## Cross-department calendar actions
- [x] Load shared employees' authorized original tasks and preserve source scope.
- [x] Enable original-task details/edit/delete/publish/drag with existing permissions and series/undo flows.
- [x] Regression tests and documentation.
- [ ] Authenticated verification with Dennis' actual bookings — external unmanaged session unavailable.
## Calendar drag and resize
- [x] Desktop/mobile movement, employee reassignment and start/end resizing with multi-employee warning.
- [x] Existing validation/series/permissions, undo, regression tests and documentation.
- [ ] Authenticated calendar save/undo and physical mobile verification — external unmanaged session unavailable.

- [x] Employees core page/table/mobile: explicit filters, result counts, empty states and preserved actions.
- [x] Cars core page/table/mobile: separate availability and scheduled periods, accessible details.
- [x] Vacation core page/tabs/content: privacy-scoped counts, search, rejected state and preserved actions.
- [x] Tests, responsive bilingual fixtures, lint, preview build and documentation.

## Previous v1.4
- [x] Messaging worker: endpoint-bound ownership token and atomic rotation/recovery tests.
- [x] Subscription persistence/status, account lifecycle and recipient diagnostics.
- [x] Inbox initial fetch, catch-up, unread and drawer cache consistency.
- [x] Read-only server-chain audit and precise deployment/secret/physical-device checklist (no deployment).
- [x] Distinct dashboard sections and responsive fixture checks.
- [x] Full tests, automatic build signal and documentation; final lint verification.
- [ ] Server fixes and closed-app physical delivery — no-deploy constraint and authorized device/runtime access required.
- [x] Module finish (C) — completed in v1.4.1.

## Previous v1.3
- [x] Shared week calculations, operation filters and URL round-trip.
- [x] Actionable planner overview, all-view filtering, day navigation and active filter reset.
- [x] Permission-gated dashboard attention links using the same calculations.
- [x] Shared planner conflict/resources context with backward-compatible standalone cards.
- [x] Regression tests, responsive fixture verification, lint and documentation.
- [ ] Authenticated full-screen verification — blocked by external unmanaged Supabase session.
- [x] Visual polish: avatar stack, sliding segments (duty + sub-departments), capacity rings, day load meter, mobile swipe publish/delete, timeline dimming, notification glide, planner keys 1–4.
- [ ] Logged-in check of swipe/load meter on a phone — external unmanaged session unavailable.
