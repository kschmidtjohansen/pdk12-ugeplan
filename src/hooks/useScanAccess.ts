import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

/** Path of the 3D-scanninger app (public/3d/index.html); inside PolyPlan it runs in a frame on SCANS_ROUTE. */
export const SCANS_URL = '/3d/index.html';
/** PolyPlan's own page for 3D-scanninger (menu, top bar and login stay PolyPlan's). */
export const SCANS_ROUTE = '/3d-scanninger';

const HAS_ACCESS = new Set(['viewer', 'editor', 'admin']);

/** Pure: does a p360_role() result give access to 3D-scanninger? */
export const scanRoleHasAccess = (role: unknown): boolean =>
  typeof role === 'string' && HAS_ACCESS.has(role);

/**
 * Read-only check of the 3D role (p360_role). Hidden until the staged 3D SQL is applied:
 * a missing function, an error or no role all mean "no link". Never writes anything.
 */
export function useScanAccess(): boolean {
  return useScanAccessState() === 'granted';
}

/** Same check with a loading state, for the 3D-scanninger page itself. */
export function useScanAccessState(): 'loading' | 'granted' | 'denied' {
  const { user, session, authReady } = useAuth();
  const userId = user?.id ?? session?.user?.id ?? null;
  const { data, isPending } = useQuery({
    queryKey: ['scan-access', userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      // p360_role is not part of the generated types (it lives in the staged 3D SQL).
      const rpc = supabase.rpc as unknown as (fn: string) => Promise<{ data: unknown; error: unknown }>;
      const { data: role, error } = await rpc.call(supabase, 'p360_role');
      return error ? false : scanRoleHasAccess(role);
    },
  });
  if (!authReady || (session && !user) || (userId && isPending)) return 'loading';
  return data === true ? 'granted' : 'denied';
}
