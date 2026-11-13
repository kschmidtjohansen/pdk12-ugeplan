/** Only 3D-scanninger (inside PolyPlan, or the old /3d address) may request a full-document login return. */
export function getLoginDestination(search: string): string {
  const requested = new URLSearchParams(search).get('returnTo');
  if (!requested) return '/dashboard';
  try {
    const origin = 'https://polyplan.invalid';
    const destination = new URL(requested, origin);
    if (destination.origin !== origin || (destination.pathname !== '/3d' && destination.pathname !== '/3d-scanninger')) return '/dashboard';
    return destination.pathname + destination.search + destination.hash;
  } catch {
    return '/dashboard';
  }
}