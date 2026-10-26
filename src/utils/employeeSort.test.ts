import { describe, it, expect } from 'vitest';
import { sortEmployeesOwnFirst } from './employeeSort';
import type { Employee } from '@/types/employee';

const emp = (id: string, name: string): Employee => ({
  id,
  name,
  email: `${id}@test.dk`,
  role: 'servicemedarbejder',
  status: 'active',
});

describe('sortEmployeesOwnFirst', () => {
  it('puts the current user first, others alphabetical', () => {
    const list = [emp('a', 'Zeta'), emp('me', 'Bente'), emp('b', 'Anna')];
    const result = sortEmployeesOwnFirst(list, 'me');
    expect(result.map(e => e.id)).toEqual(['me', 'b', 'a']);
  });

  it('sorts alphabetically when no current user is given', () => {
    const list = [emp('a', 'Zeta'), emp('b', 'Anna')];
    expect(sortEmployeesOwnFirst(list, null).map(e => e.name)).toEqual(['Anna', 'Zeta']);
  });

  it('sorts alphabetically when the current user is not in the list', () => {
    const list = [emp('a', 'Zeta'), emp('b', 'Anna')];
    expect(sortEmployeesOwnFirst(list, 'unknown').map(e => e.name)).toEqual(['Anna', 'Zeta']);
  });

  it('does not mutate the input array', () => {
    const list = [emp('a', 'Zeta'), emp('me', 'Bente')];
    sortEmployeesOwnFirst(list, 'me');
    expect(list.map(e => e.id)).toEqual(['a', 'me']);
  });
});
