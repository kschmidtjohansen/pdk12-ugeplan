/**
 * Sollys: a high-contrast mode for phones used outdoors. Stored per browser; when the user
 * has not chosen, it follows the device's "increase contrast" setting.
 */
const KEY = 'ui-sollys';

export const readSollys = (): boolean => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
  } catch { /* storage unavailable */ }
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-contrast: more)').matches;
};

export const applySollys = (on: boolean) => {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('sollys', on);
};

export const setSollys = (on: boolean) => {
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* storage unavailable */ }
  applySollys(on);
  window.dispatchEvent(new CustomEvent('sollys-change', { detail: on }));
};
