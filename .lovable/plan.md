## Plan: Polygon icon-only logo + KPI metrics above "Mine Opgaver"

### 1. Polygon logo — use the icon mark only (no "POLYGON" wordmark)

The current `AppSidebar` loads `polygon-logo.svg` from polygongroup.com, which includes the full "POLYGON" wordmark. The user wants only the round swirl/triangle symbol from the uploaded reference image — no text.

Steps:
- Copy the uploaded reference `user-uploads://Polygon_logo_png.png` into `src/assets/polygon-mark.png` so we own the asset and don't depend on the external CDN.
- Crop the image during build by rendering it inside a fixed-size container with `object-cover` + a negative offset so only the left-hand swirl symbol is visible (the wordmark is cropped out). Alternatively, the cleanest approach: ask Lovable AI Gateway is unnecessary — we render the image with `object-contain` inside a `w-8 h-8` square and shift it horizontally with `object-[0%_center]` + `scale-[2.4]` and `overflow-hidden` on the parent so only the round mark shows. We will use this technique to avoid needing a separate cropped file.
- Replace the `<img src="https://www.polygongroup.com/...">` block in `AppSidebar.tsx` (and the collapsed "P" tile) with the same icon-only mark in both states. Expanded sidebar: `h-7 w-7`. Collapsed rail: `h-7 w-7`. No text, no blue "P" placeholder.
- Use the same icon-only mark in `src/components/Layout/NavComponents/Logo.tsx` for consistency wherever it's reused (login page, etc.).

If the cropping trick produces visual artifacts, fall back to manually exporting a cropped PNG (icon-only) into `src/assets/polygon-mark.png` and reference that directly with `object-contain`.

### 2. Move KPI metrics above "Mine Opgaver" on the dashboard

Currently `DashboardCockpit.tsx` renders:
- LEFT column (2/3): `WeeklyAssignments` (= "Mine Opgaver") + `QuickAccessGrid`.
- RIGHT column (1/3, sticky): `CompactKpiStack` (the metrics: Medarbejdere / Biler / Fraværende / Lager) + `VacationNotificationsPanel` + `DutySummaryWidget` + `UpcomingVacationsWidget`.

The user's screenshot shows the small KPI tiles row (Ugeplan / Fridage / Vagt / Medarbejdere / Biler quick-access cards). They want the **metrics** moved to sit directly above "Mine Opgaver" — i.e. as a horizontal strip at the top of the LEFT column.

Changes in `DashboardCockpit.tsx`:
- Move `CompactKpiStack` out of the right `<aside>` and place it as the first child of the left column, above `WeeklyAssignments`.
- Render it only when `showMetrics` is true (unchanged condition).
- Convert `CompactKpiStack` rendering to a horizontal layout when used at the top: pass a new optional prop `orientation="horizontal"` so the four KPIs render as a 2-col (mobile) / 4-col (md+) grid of compact tiles instead of a vertical stacked card. Existing vertical usage (none after this move, but kept for safety) stays as default.
- In `CompactKpiStack.tsx`: when `orientation === 'horizontal'`, wrap the KPI rows in a `grid grid-cols-2 md:grid-cols-4 gap-2` layout, replace the `border-b` row separator with bordered tile cards (`Card` with `p-3`), keep the colored icon chip + label + value/total layout. Click handlers and modals stay identical.
- Right `<aside>` keeps `VacationNotificationsPanel`, `DutySummaryWidget`, `UpcomingVacationsWidget` (and is no longer dominated by the KPI block).

### Files touched
- `src/assets/polygon-mark.png` (new — copied from upload)
- `src/components/Layout/AppSidebar.tsx` (icon-only logo, both states)
- `src/components/Layout/NavComponents/Logo.tsx` (icon-only logo)
- `src/components/Dashboard/DashboardCockpit.tsx` (move KPI to top of left column)
- `src/components/Dashboard/CompactKpiStack.tsx` (add `orientation` prop, horizontal grid variant)
- `CHANGELOG.md`

### Out of scope
- No changes to KPI data, modals, or click behavior.
- No changes to routing, translations, or DB.
- `MineOpgaver.tsx` is unchanged (the "Mine Opgaver" card on the dashboard is `WeeklyAssignments` titled via `dashboard.myAssignments`).
