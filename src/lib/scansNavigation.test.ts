import { describe, expect, it } from 'vitest';
import { canOpenScanSettings, scanDepartmentOptions, scanSectionFromSearch } from './scansNavigation';
describe('3D navigation', () => {
  const departments = [{ id: '12', name: '12 - Fredericia' }, { id: '03', name: '03 - Hillerød' }, { id: '06', name: '06 - Holsted' }];
  it('starts with the active department and offers only its duty partners', () => {
    expect(scanDepartmentOptions(departments, '12', ['03'], 'fugttekniker').map(d => d.id)).toEqual(['12', '03']);
  });
  it('IT support can switch between all departments, but waits for active selection', () => {
    expect(scanDepartmentOptions(departments, '12', [], 'super_admin').map(d => d.id)).toEqual(['12', '03', '06']);
    expect(scanDepartmentOptions(departments, null, [], 'super_admin')).toEqual([]);
  });
  it('only exposes privileged settings to IT support', () => {
    expect(canOpenScanSettings('super_admin')).toBe(true);
    for (const role of ['administrator', 'skadeleder', 'fugttekniker', 'servicemedarbejder', undefined]) expect(canOpenScanSettings(role)).toBe(false);
  });
  it('selects valid views and falls back to tours for invalid links', () => {
    expect(scanSectionFromSearch('?view=archive')).toBe('archive');
    expect(scanSectionFromSearch('?view=shares')).toBe('shares');
    expect(scanSectionFromSearch('?view=unknown')).toBe('tours');
  });
});