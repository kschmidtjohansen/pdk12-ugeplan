# Frontend architecture
- Dashboard presentation stays in existing widgets; preserve their hooks, filtering and action handlers when changing layout.
- Shared UI primitives retain their props and variants; visual defaults belong in semantic tokens and variant classes.
- Planner and dashboard operation summaries and deep links use the shared pure plannerOperations module; this keeps ISO-week scope, filters and overlap counts consistent.
- Planner cards consume PlannerWeekDataContext with a standalone fallback; this prevents per-card query subscriptions and repeated week conflict calculations without breaking other callers.