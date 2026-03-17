

## Plan: Premium Activity Timeline Redesign

Rewrite the planner's visual structure into a modern timeline feed layout. The hero header remains vibrant and the assignment list overlaps it. Day headers become floating sticky pills with a timeline connector. Assignment cards get a completely new split-view DOM structure.

---

### Files to modify (4 files)

### 1. `src/pages/PlannerPage.tsx`

**Hero header extension** (lines 401-472):
- Add `pb-20` to the hero container so the content area can overlap it
- Add `rounded-b-[2rem]` instead of `rounded-3xl` (top corners stay rounded from parent, bottom gets the smooth curve)
- The content wrapper (line 399 `<div className="w-full px-4...">`) gets restructured:
  - Hero keeps its position
  - Everything below the hero (search bar + PlannerContent) wraps in a new div: `className="-mt-10 relative z-10 mx-auto max-w-5xl space-y-4"`
- Background changes from `bg-muted/10` to `bg-slate-50/50`

### 2. `src/components/Planner/DaySection.tsx` — Complete rewrite of render

Delete the current "big white box" wrapper. Replace with timeline layout:

**New structure:**
```
<div className="relative"> <!-- timeline container -->
  <!-- Vertical timeline line (left side connector) -->
  <div className="absolute left-5 top-10 bottom-0 w-px bg-border/40" />
  
  <!-- Floating sticky day pill -->
  <div className="sticky top-20 z-20 flex items-center gap-3 mb-4">
    <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center z-10 bg-background">
      <!-- day number -->
    </div>
    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-sm">
      <span className="text-sm font-bold">{formattedDate}</span>
      <span className="ml-2 text-xs text-muted-foreground">{count} {taskText}</span>
    </div>
    <!-- publish button (if needed) -->
  </div>
  
  <!-- Cards container with left padding for timeline -->
  <div className="pl-12 space-y-3">
    {assignments.map(...)}
  </div>
</div>
```

- The chevron expand/collapse is replaced by clicking the day pill itself
- Empty state: subtle glass indentation with dashed border inside `pl-12`
- Keep all existing props/logic/handlers — only DOM/classes change

### 3. `src/components/Planner/AssignmentCard.tsx` — Complete DOM rewrite

Delete the current `<Card>` layout. Replace with a split-view iOS notification card:

**New structure:**
```
<div className="group relative bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-2xl 
  border border-white/60 dark:border-border/40 
  shadow-[0_8px_30px_rgb(0,0,0,0.04)] 
  hover:scale-[1.01] hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)] hover:bg-white 
  transition-all duration-300 cursor-pointer overflow-hidden"
  onClick={handleCardClick}
>
  <!-- Top colored accent bar (2px) -->
  <div className="h-0.5 bg-primary" /> <!-- or bg-secondary for vacation type -->
  
  <div className="flex">
    <!-- Left: Time column -->
    <div className="w-20 flex-shrink-0 border-r border-slate-100 dark:border-border/30 
      flex flex-col items-center justify-center py-4 px-2">
      <span className="text-xs font-bold text-foreground">{fromTime}</span>
      <div className="w-4 h-px bg-border my-1" />
      <span className="text-xs text-muted-foreground">{toTime}</span>
    </div>
    
    <!-- Middle: Main details -->
    <div className="flex-1 py-3 px-4 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-foreground truncate">{title}</h3>
        {operationState && <span className="text-xs text-blue-600 animate-pulse">...</span>}
      </div>
      {location && <p className="text-xs text-muted-foreground truncate">{location}</p>}
      {responsibleUser && <p className="text-xs text-muted-foreground mt-0.5">→ {name}</p>}
      {description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{description}</p>}
      
      <!-- Inline car/employee badges row -->
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {cars as small pills}
        {warehouse indicator}
      </div>
    </div>
    
    <!-- Right: People & Status column -->
    <div className="w-24 flex-shrink-0 flex flex-col items-center justify-center py-3 px-2 gap-2">
      <!-- Overlapping avatar stack -->
      <div className="flex -space-x-2">
        {employees.slice(0,3).map(emp => (
          <div className="w-7 h-7 rounded-full bg-primary/15 text-primary 
            font-semibold text-[10px] flex items-center justify-center 
            ring-2 ring-white dark:ring-card border border-primary/20">
            {initials}
          </div>
        ))}
        {employees.length > 3 && <div className="...">+{n}</div>}
      </div>
      
      <!-- Status badge -->
      <AssignmentStatusBadge isPublished={isPublished} />
      
      <!-- Action buttons (show on hover) -->
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <AssignmentActionButtons ... />
      </div>
    </div>
  </div>
</div>
```

Key changes:
- No more `<Card>` component wrapper — raw `div` with iOS glass styling
- Split into 3 horizontal columns: Time | Details | People+Status
- Overlapping circular avatar initials for assigned employees
- Action buttons hidden by default, revealed on hover via `group-hover:opacity-100`
- Warehouse indicator moves inline as a small pill in the details column
- `border-l-4` removed, replaced by a thin colored top accent bar

### 4. `src/components/Planner/CurrentAndFutureDays.tsx`

- Change `space-y-6` to `space-y-2` (timeline sections need tighter spacing)
- The timeline line in DaySection handles visual continuity

### 5. `src/components/Planner/PastAssignments.tsx`

- Same `space-y-2` change
- Style the "Previous Days" header as a muted divider: `text-sm font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30 pb-2 mb-4`

---

### Technical notes
- Zero new dependencies
- All existing props, handlers, callbacks preserved — only DOM structure and Tailwind classes change
- `backdrop-blur-xl` on cards requires the `bg-slate-50/50` page background to show through
- Avatar initials extracted from existing `assignedEmployees` or `employees` data
- Dark mode compatible via `dark:` prefixes on key elements
- The timeline vertical line uses absolute positioning within each DaySection

