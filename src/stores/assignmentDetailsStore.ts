import { useSyncExternalStore } from 'react';

let openId: string | null = null;
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};
const getSnapshot = () => openId;
const getServerSnapshot = () => null;

export function openAssignmentDetails(id: string) {
  if (openId === id) return;
  openId = id;
  listeners.forEach(l => l());
}

export function closeAssignmentDetails() {
  if (openId === null) return;
  openId = null;
  listeners.forEach(l => l());
}

export function useAssignmentDetailsId(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
