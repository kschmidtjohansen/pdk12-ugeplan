import { supabase } from '@/integrations/supabase/client';

export interface RpcError {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}

type RpcCall = (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: RpcError | null }>;

/** True when an RPC error indicates an expired or invalid JWT. */
export const isJwtExpiredError = (error: RpcError | null | undefined): boolean => {
  const msg = (error?.message || '').toLowerCase();
  return msg.includes('jwt') && (msg.includes('expired') || msg.includes('invalid') || msg.includes('signature'));
};

// Safe RPC helper that refreshes the JWT and retries once on token expiry
export const rpcWithRefresh = async <T = unknown>(
  fnName: string,
  args?: Record<string, unknown>,
): Promise<{ data: T | null; error: RpcError | null }> => {
  try {
    await supabase.auth.getSession();
  } catch {
    // ignore
  }

  // Dynamic function names cannot be expressed with the generated RPC union type.
  const rpc = supabase.rpc.bind(supabase) as unknown as RpcCall;
  const exec = () => rpc(fnName, args);

  let { data, error } = await exec();

  if (error && isJwtExpiredError(error)) {
    try {
      await supabase.auth.refreshSession();
    } catch {
      // proceed to retry anyway
    }
    ({ data, error } = await exec());
  }

  return { data: (data as T) ?? null, error: error ?? null };
};
