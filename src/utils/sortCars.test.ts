import { describe, it, expect } from 'vitest';
import { sortCarsByNumber } from './sortCars';

describe('sortCarsByNumber', () => {
  it('sorts car numbers numerically', () => {
    const r = sortCarsByNumber([{ car_number: '11' }, { car_number: '8' }, { car_number: '10' }]);
    expect(r.map(c => c.car_number)).toEqual(['8', '10', '11']);
  });
});
