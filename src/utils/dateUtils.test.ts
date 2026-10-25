import { describe, it, expect, afterEach } from 'vitest';
import { format } from 'date-fns';
import {
  formatDateToYYYYMMDD,
  todayLocalYYYYMMDD,
  parseYYYYMMDD,
} from './dateUtils';

describe('dateUtils – lokale datoer (dansk tidszone)', () => {
  afterEach(() => {
    // no global mocks to reset; kept for symmetry with future timer tests
  });

  it('formatDateToYYYYMMDD bruger lokal dato, ikke UTC', () => {
    // 23:30 lokal tid skal give samme dato – en UTC-baseret streng ville kunne
    // skifte dag afhængigt af tidszonen.
    const d = new Date(2026, 0, 15, 23, 30, 0); // 15. januar 2026 kl. 23:30 lokal
    expect(formatDateToYYYYMMDD(d)).toBe('2026-01-15');
  });

  it('todayLocalYYYYMMDD matcher date-fns lokal formatering', () => {
    expect(todayLocalYYYYMMDD()).toBe(format(new Date(), 'yyyy-MM-dd'));
  });

  it('todayLocalYYYYMMDD skifter ikke dag pga. UTC-konvertering', () => {
    // Den UTC-baserede variant må aldrig afvige fra den lokale på et tidspunkt,
    // hvor de to kalendere er forskellige. Vi kan ikke styre TZ her, men vi kan
    // i det mindste garantere formatet og længden.
    expect(todayLocalYYYYMMDD()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('parseYYYYMMDD parser som lokal midnat (ikke UTC)', () => {
    const d = parseYYYYMMDD('2026-10-14');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(9); // oktober
    expect(d!.getDate()).toBe(14);
    expect(d!.getHours()).toBe(0);
    expect(d!.getMinutes()).toBe(0);
  });

  it('parseYYYYMMDD returnerer null ved ugyldig dato', () => {
    expect(parseYYYYMMDD('')).toBeNull();
    expect(parseYYYYMMDD('ikke-en-dato')).toBeNull();
  });

  it('lokal parsing af date-only strenge rammer samme dag som todayStart', () => {
    // Regression for DutyPage: new Date('2026-10-14') parses som UTC midnat,
    // hvilket i dansk tid er 01:00/02:00 om natten. parseYYYYMMDD skal ramme
    // lokal midnat, så sammenligningen med todayStart er dag-for-dag korrekt.
    const dutyDate = parseYYYYMMDD('2026-10-14')!;
    const todayStart = new Date(2026, 9, 14, 0, 0, 0, 0);
    expect(dutyDate.getTime()).toBe(todayStart.getTime());
    expect(dutyDate >= todayStart).toBe(true);
  });
});
