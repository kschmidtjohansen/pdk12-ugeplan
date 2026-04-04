

## Plan: Inline Conflict Banner + "Book Available Days Only"

### Current State
The conflict check already works and shows an `AlertDialog` popup. The user wants:
1. Replace/enhance the dialog with an **inline warning banner** inside the form
2. Add a **"Book available days only"** button that removes conflicting employee×date combos from formData automatically

### Changes

#### 1. `src/components/Planner/AssignmentForm.tsx`
- **Replace AlertDialog with inline banner**: When `conflictDetails` has data, render a prominent warning card (destructive border, `AlertTriangle` icon) between the form fields and the action buttons.
- **Banner content**: List each conflict as "{employeeName} er utilgængelig d. {date} — {reason}: {details}".
- **Three action buttons** inside the banner:
  - **"Annuller"** — clears conflicts and resets submission state
  - **"Book kun ledige dage"** — computes the safe subset by removing conflicting employee×date pairs from `formData.dates` (or removing the employee entirely if all their dates conflict), then auto-submits with the cleaned data
  - **"Opret alligevel"** — proceeds with the original data (keep existing behavior)
- **"Book available days only" logic**: For each conflict, if employee has conflicts on some dates but not all, remove only those dates for that employee. Since the current data model assigns all employees to all dates in one assignment, the simplest correct approach is: remove dates where ANY selected employee has a conflict, keeping only fully conflict-free dates. If no dates remain, show a toast saying all dates have conflicts.
- Remove the `AlertDialog` import and markup (no longer needed).

#### 2. `src/translations/da/planner.ts`
Add keys:
- `conflicts.bookAvailableOnly`: `'Book kun ledige dage'`
- `conflicts.warningPrefix`: `'er utilgængelig d.'`
- `conflicts.allDatesConflict`: `'Alle valgte datoer har konflikter — ingen dage at booke'`

#### 3. `src/translations/en/planner.ts`
Same keys in English:
- `conflicts.bookAvailableOnly`: `'Book available days only'`
- `conflicts.warningPrefix`: `'is unavailable on'`
- `conflicts.allDatesConflict`: `'All selected dates have conflicts — no days to book'`

#### 4. `CHANGELOG.md`
Document the inline conflict banner and "Book available days only" feature.

### UI Design
The banner follows the project's card-based design system with `rounded-2xl border-destructive/40 bg-destructive/5 p-4` styling, matching the existing conflict card pattern but rendered inline in the form rather than as a modal overlay.

