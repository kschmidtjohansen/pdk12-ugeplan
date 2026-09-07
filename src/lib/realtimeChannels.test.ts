import { beforeEach, describe, expect, it, vi } from 'vitest';

const channel = {
  on: vi.fn(function () { return this; }),
  subscribe: vi.fn(function () { return this; }),
};
const removeChannel = vi.fn();
const createChannel = vi.fn(() => channel);

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: createChannel,
    removeChannel,
  },
}));

describe('realtimeChannels', () => {
  beforeEach(async () => {
    vi.resetModules();
    createChannel.mockClear();
    removeChannel.mockClear();
    channel.on.mockClear();
    channel.subscribe.mockClear();
  });

  it('reuses one physical channel for matching subscriptions', async () => {
    const { getActiveChannelStats, subscribeToTable } = await import('./realtimeChannels');
    const unsubscribeA = subscribeToTable({ key: 'a', table: 'trainings', callback: vi.fn() });
    const unsubscribeB = subscribeToTable({ key: 'b', table: 'trainings', callback: vi.fn() });

    expect(createChannel).toHaveBeenCalledTimes(1);
    expect(getActiveChannelStats()).toEqual({ channels: 1, listeners: 2 });

    unsubscribeA();
    unsubscribeB();
    expect(removeChannel).toHaveBeenCalledTimes(1);
  });

  it('does not let stale cleanup remove a replacement subscription', async () => {
    const { getActiveChannelStats, subscribeToTable } = await import('./realtimeChannels');
    const staleCleanup = subscribeToTable({ key: 'same', table: 'trainings', callback: vi.fn() });
    const currentCleanup = subscribeToTable({ key: 'same', table: 'trainings', callback: vi.fn() });

    staleCleanup();
    expect(getActiveChannelStats()).toEqual({ channels: 1, listeners: 1 });

    currentCleanup();
    expect(getActiveChannelStats()).toEqual({ channels: 0, listeners: 0 });
  });
});