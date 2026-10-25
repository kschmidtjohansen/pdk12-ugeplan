import { describe, it, expect } from 'vitest';
import { PRODUCT_NAME, ORG_NAME, PRODUCT_TAGLINE_DA } from './product';

describe('product identity', () => {
  it('product name is PolyPlan', () => {
    expect(PRODUCT_NAME).toBe('PolyPlan');
  });

  it('organisation remains Polygon', () => {
    expect(ORG_NAME).toContain('Polygon');
  });

  it('has a Danish tagline', () => {
    expect(PRODUCT_TAGLINE_DA.length).toBeGreaterThan(0);
  });
});
