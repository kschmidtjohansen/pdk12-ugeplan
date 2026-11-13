import { supabase } from '@/integrations/supabase/client';

/**
 * Screen display (/screen-display) data calls. A screen opened from a screen link carries a secret code
 * (?screen=...) that an admin can revoke; it then reads through the *_by_token functions, which check the
 * code against the department. Without a code the old functions are used (only for logged-in users once
 * supabase/staged/sql/004_screen_display_lockdown.sql has been applied).
 */
export type ScreenRpc = 'list_screen_display_assignments' | 'list_screen_display_absences' | 'list_screen_display_sub_departments';

const TOKEN = /^[0-9a-f]{32,128}$/;

/** The screen code from the address, or null. */
export function getScreenToken(search: string = typeof window !== 'undefined' ? window.location.search : ''): string | null {
  const t = new URLSearchParams(search).get('screen');
  return t && TOKEN.test(t) ? t : null;
}

/** Which function to call and with which arguments (pure, for tests). */
export function screenCall(name: ScreenRpc, args: Record<string, unknown>, token: string | null): { fn: string; args: Record<string, unknown> } {
  return token ? { fn: `${name}_by_token`, args: { p_token: token, ...args } } : { fn: name, args };
}

export function screenRpc<T = unknown>(name: ScreenRpc, args: Record<string, unknown>) {
  const { fn, args: a } = screenCall(name, args, getScreenToken());
  // the *_by_token functions are not in the generated types yet
  const rpc = supabase.rpc as unknown as (f: string, p: Record<string, unknown>) => Promise<{ data: T | null; error: { message: string } | null }>;
  return rpc.call(supabase, fn, a);
}

/** The address a screen should open. */
export function screenUrl(origin: string, departmentId: string, token: string): string {
  const host = new URL(origin).hostname;
  // Lovable editor/preview addresses require a Lovable session, which signage players cannot share.
  const publicOrigin = /(^|\.)(lovableproject\.com|lovable\.app)$/.test(host) && host !== 'polyplan.lovable.app'
    ? 'https://polyplan.lovable.app'
    : origin;
  return `${publicOrigin}/screen-display?departmentId=${encodeURIComponent(departmentId)}&screen=${encodeURIComponent(token)}`;
}
