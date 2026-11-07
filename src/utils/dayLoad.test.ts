import { describe, it, expect } from 'vitest';
import { dayPersonHours, dayLoadLevel } from './dayLoad';
import type { Assignment } from '@/types/assignment';

const a = (fromTime: string, toTime: string, employees: string[]) => ({ fromTime, toTime, employees } as unknown as Assignment);

describe('dayLoad', () => {
  it('ganger varighed med antal medarbejdere', () => expect(dayPersonHours([a('08:00', '12:00', ['x', 'y'])])).toBe(8));
  it('tom dag er niveau 0', () => expect(dayLoadLevel(0)).toBe(0));
  it('15 t er rolig', () => expect(dayLoadLevel(15)).toBe(1));
  it('16 t er travl', () => expect(dayLoadLevel(16)).toBe(2));
  it('40 t er meget travl', () => expect(dayLoadLevel(40)).toBe(3));
});
