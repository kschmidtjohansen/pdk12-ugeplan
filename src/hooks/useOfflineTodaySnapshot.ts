import { useEffect, useState } from 'react';
import type { Assignment } from '@/types/assignment';

export interface OfflineSnapshot {
  savedAt: string;
  assignments: Assignment[];
  phones: Record<string, string>;
}

const keyFor = (userId: string, day: string) => `polyplan_offline_today_${userId}_${day}`;

export function useOnlineStatus(onReconnect?: () => void) {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const up = () => { setOnline(true); onReconnect?.(); };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, [onReconnect]);
  return online;
}

export function saveSnapshot(userId: string, day: string, assignments: Assignment[], phones: Record<string, string>) {
  try {
    // Drop older days for this user to keep storage lean
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(`polyplan_offline_today_${userId}_`) && k !== keyFor(userId, day)) localStorage.removeItem(k);
    }
    const snap: OfflineSnapshot = { savedAt: new Date().toISOString(), assignments, phones };
    localStorage.setItem(keyFor(userId, day), JSON.stringify(snap));
  } catch { /* storage full/unavailable */ }
}

export function loadSnapshot(userId: string, day: string): OfflineSnapshot | null {
  try {
    const raw = localStorage.getItem(keyFor(userId, day));
    return raw ? (JSON.parse(raw) as OfflineSnapshot) : null;
  } catch {
    return null;
  }
}
