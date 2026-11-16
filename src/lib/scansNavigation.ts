export const scanSections = ['tours', 'shares', 'archive', 'settings'] as const;
export type ScanSection = typeof scanSections[number];
export function scanSectionFromSearch(search: string): ScanSection {
  const section = new URLSearchParams(search).get('view');
  return scanSections.find(value => value === section) ?? 'tours';
}
export const canOpenScanSettings = (role: unknown): boolean => role === 'super_admin';

export function scanDepartmentOptions<T extends { id: string; name: string }>(departments: T[], activeId: string | null, sharedIds: string[], role: unknown): T[] {
  if (!activeId) return [];
  const allowed = new Set([activeId, ...sharedIds]);
  return departments.filter(d => role === 'super_admin' || allowed.has(d.id))
    .sort((a, b) => a.id === activeId ? -1 : b.id === activeId ? 1 : a.name.localeCompare(b.name, 'da'));
}