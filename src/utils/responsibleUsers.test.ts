import { describe, it, expect } from 'vitest';
import { isEligibleResponsibleUser } from './responsibleUsers';

describe('isEligibleResponsibleUser', () => {
  it('skadeleder kan vælges som sagsansvarlig', () => {
    expect(isEligibleResponsibleUser({ role: 'skadeleder', roles: ['skadeleder'] })).toBe(true);
  });
  it('skadeleder som sekundær rolle tæller med', () => {
    expect(isEligibleResponsibleUser({ role: 'fugttekniker', roles: ['fugttekniker', 'skadeleder'] })).toBe(true);
  });
  it('servicemedarbejder kan ikke vælges', () => {
    expect(isEligibleResponsibleUser({ role: 'servicemedarbejder', roles: ['servicemedarbejder'] })).toBe(false);
  });
});
