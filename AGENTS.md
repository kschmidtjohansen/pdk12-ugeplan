# Frontend architecture
- Dashboard presentation stays in existing widgets; preserve their hooks, filtering and action handlers when changing layout.
- Shared UI primitives retain their props and variants; visual defaults belong in semantic tokens and variant classes.
- Planner and dashboard operation summaries and deep links use the shared pure plannerOperations module; this keeps ISO-week scope, filters and overlap counts consistent.
- Planner cards consume PlannerWeekDataContext with a standalone fallback; this prevents per-card query subscriptions and repeated week conflict calculations without breaking other callers.
- Inbox state and drawer query keys are scoped to authenticated user IDs; authoritative catch-up reconciles mutations and missed realtime events without duplicate unread increments.
- Messaging worker ownership state uses endpoint-keyed IndexedDB tokens and a transactional latest pointer retaining account ownership; this prevents cross-endpoint token fallback and supports recovery.
- Module list toolbars are opt-in controlled UI; employee/car filters and vacation visibility-before-counting use shared pure helpers to retain the existing data hooks and action handlers.

- Edge authorization decisions live in src/security/backend/policies.ts with a byte-identical copy in supabase/staged/functions/_shared (test-enforced); unreviewed server changes are staged under supabase/staged/ so they are never auto-deployed.
