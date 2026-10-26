import { describe, it, expect } from 'vitest';
import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  DAY_END_MIN,
  HOUR_PX,
  MIN_SLOT_PX,
  toMinutes,
  hourSlots,
  gridHeightPx,
  slotTopPx,
  slotHeightPx,
  hourLabel,
  isWithinDay,
} from './calendarTimeGrid';

describe('calendarTimeGrid – full day 00:00–23:59', () => {
  it('covers the whole day from 00:00 to 23:59', () => {
    expect(DAY_START_HOUR).toBe(0);
    expect(DAY_END_HOUR).toBe(24);
    expect(DAY_END_MIN).toBe(1440);
    const slots = hourSlots();
    expect(slots).toHaveLength(24);
    expect(slots[0]).toBe(0);
    expect(slots[23]).toBe(23);
    expect(gridHeightPx()).toBe(24 * HOUR_PX);
  });

  it('parses times including the last minute of the day', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('23:59')).toBe(1439);
    expect(toMinutes('07:30')).toBe(450);
    expect(toMinutes(undefined)).toBeNull();
    expect(toMinutes('kl.')).toBeNull();
  });

  it('keeps a task at the very start of the day inside the grid', () => {
    expect(slotTopPx(toMinutes('00:00')!)).toBe(0);
    expect(slotHeightPx(0, 60)).toBe(HOUR_PX - 2);
  });

  it('keeps a late-evening task visible instead of clipping it', () => {
    const top = slotTopPx(toMinutes('23:30')!);
    const height = slotHeightPx(toMinutes('23:30')!, toMinutes('23:59')!);
    expect(top).toBeGreaterThan(0);
    expect(top).toBeLessThan(gridHeightPx());
    expect(height).toBeGreaterThanOrEqual(MIN_SLOT_PX);
    expect(top + height).toBeLessThanOrEqual(gridHeightPx() + MIN_SLOT_PX);
  });

  it('clamps a task that runs past midnight to the end of the day', () => {
    const start = toMinutes('23:00')!;
    expect(slotHeightPx(start, 30 * 60)).toBe(slotHeightPx(start, DAY_END_MIN));
  });

  it('labels hours with a leading zero and reports day membership', () => {
    expect(hourLabel(0)).toBe('00:00');
    expect(hourLabel(9)).toBe('09:00');
    expect(hourLabel(23)).toBe('23:00');
    expect(isWithinDay(0)).toBe(true);
    expect(isWithinDay(1439)).toBe(true);
    expect(isWithinDay(1441)).toBe(false);
  });
});
