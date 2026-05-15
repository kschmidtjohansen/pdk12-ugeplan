## Status: Already implemented — no changes needed

`src/context/AuthContext.tsx` already follows the requested pattern.

### Verification
- **Empty deps array**: The auth-init `useEffect` containing `supabase.auth.onAuthStateChange` ends with `}, []);` at line 500.
- **`tRef`**: Lines 125–126 — `const tRef = useRef(t); useEffect(() => { tRef.current = t; }, [t]);`
- **`toastRef`**: Lines 127–128 — `const toastRef = useRef(toast); useEffect(() => { toastRef.current = toast; }, [toast]);`
- **Listener uses refs**: Lines 314–316 inside the `onAuthStateChange` callback call `toastRef.current({...})` and `tRef.current(...)` — never the closure-captured `t` or `toast` directly.
- **`navigate`**: Not used in this file; navigation is performed via `window.location.replace('/login')` (line 324), so no `navigate` ref is needed.
- **No deps leak**: `t`, `toast`, `navigate`, and `queryClient` are NOT listed in the auth-init effect's dependency array.

Comment on lines 121–122 already documents the intent:
> "Stored in a ref so the auth-init effect does not re-subscribe every time TranslationContext re-renders."

### Recommendation
No code change required. Approve this plan as a no-op confirmation.