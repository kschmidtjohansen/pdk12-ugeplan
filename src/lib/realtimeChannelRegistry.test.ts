import { describe, expect, it, mock } from 'bun:test';
import { RealtimeChannelRegistry } from './realtimeChannelRegistry';

describe('RealtimeChannelRegistry', () => {
  it('keeps multiple listeners on one channel', () => {
    const registry = new RealtimeChannelRegistry<string>();
    const first = mock(() => undefined);
    const second = mock(() => undefined);

    registry.add('public:trainings:*:', 'first', first);
    registry.add('public:trainings:*:', 'second', second);
    registry.emit('public:trainings:*:', 'changed');

    expect(registry.listenerCount('public:trainings:*:')).toBe(2);
    expect(first).toHaveBeenCalledWith('changed');
    expect(second).toHaveBeenCalledWith('changed');
  });

  it('does not let stale cleanup remove a replacement listener', () => {
    const registry = new RealtimeChannelRegistry();
    const oldRegistration = registry.add('public:trainings:*:', 'same', () => undefined);
    const currentRegistration = registry.add('public:trainings:*:', 'same', () => undefined);

    expect(registry.remove('same', oldRegistration)).toBeNull();
    expect(registry.listenerCount('public:trainings:*:')).toBe(1);
    expect(registry.remove('same', currentRegistration)).toEqual({
      channelKey: 'public:trainings:*:',
      isEmpty: true,
    });
  });
});