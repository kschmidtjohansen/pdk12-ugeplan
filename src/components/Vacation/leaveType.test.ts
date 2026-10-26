import { describe, it, expect } from 'vitest';
import { buildLeaveReason, parseLeaveReason } from './leaveType';

describe('leave type', () => {
  it('stores Feriefridag with note', () => {
    expect(buildLeaveReason('Feriefridag', 'Fredag')).toBe('Feriefridag – Fredag');
    expect(parseLeaveReason('Feriefridag – Fredag')).toEqual({ type: 'Feriefridag', note: 'Fredag' });
  });
  it('Afspadsering without note', () => {
    expect(parseLeaveReason(buildLeaveReason('Afspadsering', ''))).toEqual({ type: 'Afspadsering', note: '' });
  });
  it('old free-text reasons have no type, so a new request must choose one', () => {
    expect(parseLeaveReason('Sommerferie').type).toBeNull();
  });
});
