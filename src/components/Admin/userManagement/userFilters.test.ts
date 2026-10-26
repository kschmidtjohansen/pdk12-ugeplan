import { describe, it, expect } from 'vitest';
import { filterUsersByDepartment, searchUsers, sortUsersByName, countRoles, mapProfileToAdminUser, DEMO_USER_EMAIL } from './userFilters';
import type { AdminUser } from '../UserTableRow';

const u = (id: string, name: string, role: AdminUser['role'], extra: Partial<AdminUser> = {}): AdminUser =>
  ({ id, name, email: `${id}@x.dk`, role, ...extra });
const users = [
  u('a', 'Bo', 'skadeleder'),
  u('b', 'Anne', 'vikar', { banned_until: '2999-01-01' }),
  u('c', 'Casper', 'administrator'),
  u('demo', 'Demo', 'administrator', { email: DEMO_USER_EMAIL }),
];
const access = [{ user_id: 'a', department_id: 'd1' }, { user_id: 'b', department_id: 'd2' }];

describe('user admin filters', () => {
  it('current department shows only its members', () => {
    expect(filterUsersByDepartment(users, access, 'current', 'd1', false).map(x => x.id)).toEqual(['a']);
  });
  it('unassigned shows users without department, demo hidden', () => {
    expect(filterUsersByDepartment(users, access, 'unassigned', 'd1', false).map(x => x.id)).toEqual(['c']);
  });
  it('demo account visible in demo mode', () => {
    expect(filterUsersByDepartment(users, access, 'unassigned', null, true).map(x => x.id)).toContain('demo');
  });
  it('search matches name/email case-insensitively', () => {
    expect(searchUsers(users, 'casp', [], 'all').map(x => x.id)).toEqual(['c']);
  });
  it('status filter separates active/inactive', () => {
    expect(searchUsers(users, '', [], 'inactive').map(x => x.id)).toEqual(['b']);
    expect(searchUsers(users, '', ['vikar'], 'active')).toHaveLength(0);
  });
  it('sorts by name both ways', () => {
    expect(sortUsersByName(users, 'asc')[0].name).toBe('Anne');
    expect(sortUsersByName(users, 'desc')[0].name).toBe('Demo');
  });
  it('counts roles', () => expect(countRoles(users)).toEqual({ skadeleder: 1, vikar: 1, administrator: 2 }));
  it('profile without role defaults to servicemedarbejder', () => {
    const m = mapProfileToAdminUser({ id: 'x', email: 'e', name: 'n', created_at: '', updated_at: '' });
    expect(m.role).toBe('servicemedarbejder');
  });
  it('role filter matches ANY of a user\'s assigned roles', () => {
    const multi = u('m', 'Martin', 'fugttekniker', { roles: ['fugttekniker', 'skadeleder'] });
    expect(searchUsers([multi], '', ['skadeleder'], 'all').map(x => x.id)).toEqual(['m']);
    expect(searchUsers([multi], '', ['fugttekniker'], 'all').map(x => x.id)).toEqual(['m']);
    expect(searchUsers([multi], '', ['administrator'], 'all')).toHaveLength(0);
  });
  it('profile with multiple roles gets the highest-privilege role and keeps all roles', () => {
    const m = mapProfileToAdminUser(
      { id: 'x', email: 'e', name: 'n', created_at: '', updated_at: '' },
      ['fugttekniker', 'skadeleder'],
    );
    expect(m.role).toBe('skadeleder');
    expect(m.roles).toEqual(['skadeleder', 'fugttekniker']);
  });
  it('profile with a single role in the list keeps it', () => {
    const m = mapProfileToAdminUser(
      { id: 'x', email: 'e', name: 'n', created_at: '', updated_at: '' },
      ['vikar'],
    );
    expect(m.role).toBe('vikar');
    expect(m.roles).toEqual(['vikar']);
  });
});
