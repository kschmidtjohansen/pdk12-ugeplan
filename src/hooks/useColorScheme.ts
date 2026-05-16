import { useCallback, useEffect, useState } from 'react';

export type ColorScheme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'color_scheme';

export const getStoredColorScheme = (): ColorScheme => {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY) as ColorScheme | null;
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
};

export const applyColorScheme = (scheme: ColorScheme) => {
  if (typeof window === 'undefined') return;
  const isDark =
    scheme === 'dark' ||
    (scheme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
};

export const useColorScheme = () => {
  const [scheme, setSchemeState] = useState<ColorScheme>(() => getStoredColorScheme());

  const setScheme = useCallback((next: ColorScheme) => {
    localStorage.setItem(STORAGE_KEY, next);
    applyColorScheme(next);
    setSchemeState(next);
  }, []);

  useEffect(() => {
    if (scheme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyColorScheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [scheme]);

  return { scheme, setScheme };
};
