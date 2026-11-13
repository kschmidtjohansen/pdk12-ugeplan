import { describe, expect, it } from 'vitest';
import { getScreenToken, screenCall, screenUrl } from './screenDisplayRpc';

const tok = 'a'.repeat(48);
describe('screen display calls', () => {
  it('reads a valid screen code from the address only', () => {
    expect(getScreenToken('?departmentId=x&screen=' + tok)).toBe(tok);
    expect(getScreenToken('?departmentId=x')).toBeNull();
    expect(getScreenToken('?screen=short')).toBeNull();
    expect(getScreenToken('?screen=' + 'g'.repeat(48))).toBeNull();
  });
  it('uses the token functions when the screen has a code', () => {
    expect(screenCall('list_screen_display_absences', { p_department_id: 'd', p_date: '2026-11-12' }, tok))
      .toEqual({ fn: 'list_screen_display_absences_by_token', args: { p_token: tok, p_department_id: 'd', p_date: '2026-11-12' } });
  });
  it('keeps the old functions for screens without a code', () => {
    expect(screenCall('list_screen_display_sub_departments', { p_department_id: 'd' }, null))
      .toEqual({ fn: 'list_screen_display_sub_departments', args: { p_department_id: 'd' } });
  });
  it('builds the screen address', () => {
    expect(screenUrl('https://polyplan.dk', 'd-1', tok)).toBe('https://polyplan.dk/screen-display?departmentId=d-1&screen=' + tok);
  });
  it('uses the published address instead of the Lovable-login-protected editor address', () => {
    expect(screenUrl('https://36e31d23-3e75-40a2-a667-29e15996f644.lovableproject.com', 'd-12', tok))
      .toBe('https://polyplan.lovable.app/screen-display?departmentId=d-12&screen=' + tok);
  });
  it('uses the published address instead of a preview address', () => {
    expect(screenUrl('https://id-preview--36e31d23-3e75-40a2-a667-29e15996f644.lovable.app', 'd-12', tok))
      .toBe('https://polyplan.lovable.app/screen-display?departmentId=d-12&screen=' + tok);
  });
  it('retains the published address', () => {
    expect(screenUrl('https://polyplan.lovable.app', 'd-12', tok))
      .toBe('https://polyplan.lovable.app/screen-display?departmentId=d-12&screen=' + tok);
  });
});
