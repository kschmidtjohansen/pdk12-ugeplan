import { supabase } from '@/integrations/supabase/client';

// Safe RPC helper that refreshes the JWT and retries once on token expiry
export const rpcWithRefresh = async <T = any>(fnName: string, args?: Record<string, any>): Promise<{ data: T | null; error: any | null }> => {
  // Ensure we have a session (will trigger refresh if needed by the SDK)
  try {
    await supabase.auth.getSession();
  } catch (_) {
    // ignore
  }

  const exec = () => supabase.rpc(fnName as any, args as any);

  let { data, error } = await exec();
  const msg = (error?.message || '').toLowerCase();

  // Detect expired JWT and retry once after refresh
  const isJwtExpired = msg.includes('jwt') && (msg.includes('expired') || msg.includes('invalid') || msg.includes('signature'));
  if (error && isJwtExpired) {
    try {
      await supabase.auth.refreshSession();
    } catch (_) {
      // proceed to retry anyway
    }
    const retry = await exec();
    data = retry.data as any;
    error = retry.error as any;
  }

  return { data: (data as T) ?? null, error: error ?? null };
};
