import { useCallback, useSyncExternalStore } from 'react';

export type ListDensity = 'comfortable' | 'compact';

const KEY = 'polyplan.listDensity';
const EVENT = 'polyplan:list-density';

function read(): ListDensity {
  try {
    return window.localStorage.getItem(KEY) === 'compact' ? 'compact' : 'comfortable';
  } catch {
    return 'comfortable';
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) onChange(); };
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/** Per-browser row density for list tables; shared across list pages and tabs. */
export function useListDensity(): [ListDensity, (next: ListDensity) => void] {
  const density = useSyncExternalStore(subscribe, read, () => 'comfortable' as ListDensity);
  const set = useCallback((next: ListDensity) => {
    try { window.localStorage.setItem(KEY, next); } catch { /* storage unavailable: keep default */ }
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [density, set];
}
