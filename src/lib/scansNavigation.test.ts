import { describe, expect, it } from 'vitest';
import { canOpenScanSettings, scanSectionFromSearch } from './scansNavigation';
describe('3D navigation', () => {
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