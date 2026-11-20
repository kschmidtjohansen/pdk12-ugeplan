import { useEffect, useState } from 'react';
import { readSollys, setSollys } from '@/lib/sollys';

/** Current Sollys state plus a setter; stays in sync across components. */
export const useSollys = () => {
  const [on, setOn] = useState(readSollys);
  useEffect(() => {
    const sync = () => setOn(readSollys());
    window.addEventListener('sollys-change', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sollys-change', sync); window.removeEventListener('storage', sync); };
  }, []);
  return [on, setSollys] as const;
};
