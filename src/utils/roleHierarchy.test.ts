import { describe, it, expect } from 'vitest';
import { getEffectiveRole, sortRolesByRank, ROLE_RANK } from './roleHierarchy';

describe('roleHierarchy', () => {
  it('ranks every role uniquely (higher = more privileged)', () => {
    const ranks = Object.values(ROLE_RANK);
    expect(new Set(ranks).size).toBe(ranks.length);
    expect(ROLE_RANK.super_admin).toBeGreaterThan(ROLE_RANK.administrator);
    expect(ROLE_RANK.administrator).toBeGreaterThan(ROLE_RANK.skadeleder);
    expect(ROLE_RANK.skadeleder).toBeGreaterThan(ROLE_RANK.fugttekniker);
    expect(ROLE_RANK.fugttekniker).toBeGreaterThan(ROLE_RANK.servicemedarbejder);
    expect(ROLE_RANK.servicemedarbejder).toBeGreaterThan(ROLE_RANK.vikar);
  });

  it('picks the highest-privilege role regardless of order', () => {
    expect(getEffectiveRole(['fugttekniker', 'skadeleder'])).toBe('skadeleder');
    expect(getEffectiveRole(['skadeleder', 'fugttekniker'])).toBe('skadeleder');
    expect(getEffectiveRole(['vikar', 'administrator', 'servicemedarbejder'])).toBe('administrator');
  });

  it('falls back to servicemedarbejder for empty input', () => {
    expect(getEffectiveRole([])).toBe('servicemedarbejder');
    expect(getEffectiveRole(null)).toBe('servicemedarbejder');
    expect(getEffectiveRole([null, undefined])).toBe('servicemedarbejder');
  });

  it('sorts roles from highest to lowest privilege', () => {
    expect(sortRolesByRank(['vikar', 'skadeleder', 'fugttekniker'])).toEqual(['skadeleder', 'fugttekniker', 'vikar']);
  });
});
