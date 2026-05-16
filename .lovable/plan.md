Replace the existing realtime debounce logic in three hooks with a uniform ref-based 500ms throttle pattern.

### What changes

1. **src/hooks/useOptimizedAssignments.ts** — Planner assignments realtime handler
   - Add `const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);` at the hook level.
   - In the `subscribeToTables` callback, replace the current `debounceTimer` local variable with the ref pattern:
     ```ts
     if (throttleRef.current) clearTimeout(throttleRef.current);
     throttleRef.current = setTimeout(() => {
       OptimizedAssignmentService.clearCache();
       queryClient.invalidateQueries({ queryKey: ['assignments'] });
     }, 500);
     ```
   - Clean up in the `useEffect` return: `if (throttleRef.current) clearTimeout(throttleRef.current);`.

2. **src/hooks/car/useCarData.ts** — Cars realtime handler
   - Add the same `throttleRef` at the hook level.
   - Wrap the existing `queryClient.invalidateQueries({ queryKey: ['cars'] })` inside the `subscribeToTable` callback with the same 500ms ref-based throttle.
   - Clean up the timeout in the `useEffect` return.

3. **src/hooks/employee/useEmployeeData.ts** — Employees realtime handler
   - Replace the existing local `timeoutId` debounce with the same ref-based 500ms throttle.
   - Clean up in the `useEffect` return.

### Why
All three handlers currently use ad-hoc debounce (or none at all). Unifying them to a single ref-based 500ms throttle reduces redundant invalidation bursts when realtime fires multiple events in rapid succession, and makes the pattern consistent across the codebase.