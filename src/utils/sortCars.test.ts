import { describe, it, expect } from 'vitest';
import { sortCarsByNumber } from './sortCars';

describe('sortCarsByNumber', () => {
  it('sorts car numbers numerically', () => {
    const r = sortCarsByNumber([{ car_number: '11' }, { car_number: '8' }, { car_number: '10' }]);
    expect(r.map(c => c.car_number)).toEqual(['8', '10', '11']);
  });
  it('places Hillerød BIL25 before 26 rather than on the final page', () => {
    const car25 = { id: 'ddd7cfc0-f9bb-453f-89dc-e854095d0f26', car_number: 'BIL25' };
    const rows = Array.from({ length: 28 }, (_, i) => ({ id: `car-${i + 1}`, car_number: String(i + 1) }));
    rows[24] = car25;
    const sorted = sortCarsByNumber(rows);
    expect(sorted[24]).toEqual(car25);
    expect(sorted.slice(0, 25)).toContain(car25);
    expect(sorted[25].car_number).toBe('26');
    expect(car25.car_number).toBe('BIL25');
  });
});
