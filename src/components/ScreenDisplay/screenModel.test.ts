import { describe, expect, it } from 'vitest';
import { Assignment } from '@/types/assignment';
import { buildCrews, buildSignagePages, chunk, pickScreenMode } from './screenModel';

const task = (id: string, from: string, cars: string[], people: string[]): Assignment => ({
  id, title: `Opgave ${id}`, date: '2026-11-20', fromTime: from, toTime: '16:00', location: 'Skovvej 12', published: true,
  cars, assignedEmployees: people.map(name => ({ id: name, name, email: '' })),
});

describe('pickScreenMode', () => {
  const day = new Date(2026, 10, 20);
  it('viser overblikket før 09:00 og rundvisningen fra 09:00 i dag', () => {
    expect(pickScreenMode(new Date(2026, 10, 20, 7, 30), day)).toBe('overview');
    expect(pickScreenMode(new Date(2026, 10, 20, 8, 59), day)).toBe('overview');
    expect(pickScreenMode(new Date(2026, 10, 20, 9, 0), day)).toBe('signage');
  });
  it('viser altid overblikket for en anden dag', () => {
    expect(pickScreenMode(new Date(2026, 10, 20, 12, 0), new Date(2026, 10, 21))).toBe('overview');
  });
  it('kan låses med ?mode=', () => {
    expect(pickScreenMode(new Date(2026, 10, 20, 7, 0), day, 'signage')).toBe('signage');
    expect(pickScreenMode(new Date(2026, 10, 20, 12, 0), day, 'overview')).toBe('overview');
  });
});

describe('buildCrews', () => {
  it('samler hold pr. bil i bilnummer-orden og lægger folk uden bil til sidst', () => {
    const crews = buildCrews([
      task('b', '10:00', ['Bil 11'], ['Jonas']),
      task('a', '07:00', ['Bil 5'], ['Sara', 'Ali']),
      task('c', '12:00', ['Bil 5'], ['Ali', 'Mette']),
      task('d', '09:00', [], ['Peter', 'Ali']),
    ]);
    expect(crews.map(c => c.car)).toEqual(['Bil 5', 'Bil 11', null]);
    expect(crews[0].people).toEqual(['Ali', 'Mette', 'Sara']);
    expect(crews[0].first?.id).toBe('a');
    expect(crews[2].people).toEqual(['Peter']);
  });
});

describe('buildSignagePages', () => {
  it('laver hold-, opgave- og fraværssider og deler lange lister op', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => task(String(i), `0${i % 10}:00`, [`Bil ${i}`], [`P${i}`]));
    const pages = buildSignagePages(tasks, ['Lars'], 6, 8);
    expect(pages.map(p => p.kind)).toEqual(['crews', 'crews', 'tasks', 'tasks', 'absent']);
    expect(buildSignagePages(tasks, []).some(p => p.kind === 'absent')).toBe(false);
  });
  it('udelader afsluttede opgaver i rundvisningen', () => {
    const tasks = [{ ...task('a', '07:00', [], ['A']), toTime: '08:00' }, task('b', '10:00', [], ['B'])];
    const pages = buildSignagePages(tasks, [], 6, 8, 9 * 60);
    const taskPage = pages.find(p => p.kind === 'tasks');
    expect(taskPage && taskPage.kind === 'tasks' ? taskPage.tasks.map(t => t.id) : []).toEqual(['b']);
  });
  it('chunk deler i stykker', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});
