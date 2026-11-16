export const scanSections = ['tours', 'shares', 'archive', 'settings'] as const;
export type ScanSection = typeof scanSections[number];
export function scanSectionFromSearch(search: string): ScanSection {
  const section = new URLSearchParams(search).get('view');
  return scanSections.find(value => value === section) ?? 'tours';
}
export const canOpenScanSettings = (role: unknown): boolean => role === 'super_admin';