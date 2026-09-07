/**
 * Shared realtime channels.
 *
 * Reduces WebSocket fan-out by reusing a single Supabase Realtime channel per
 * (schema, table, event, filter) tuple across the app. Each caller registers a
 * listener with a unique key and gets back an `unsubscribe` function. The
 * underlying channel is created on the first subscriber and torn down when the
 * ref-count hits zero.
 */
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { RealtimeChannelRegistry } from '@/lib/realtimeChannelRegistry';

type Event = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface SubscribeOptions {
  /** Unique caller key — used for de-dup and explicit unsubscribe. */
  key: string;
  table: string;
  schema?: 'public' | 'demo';
  event?: Event;
  /** Optional postgres_changes filter (e.g. "user_id=eq.uuid"). */
  filter?: string;
  callback: (payload: any) => void;
}

interface SharedChannel {
  channel: RealtimeChannel;
  /** Composite key used as the map index in `channels`. */
  channelKey: string;
}

const channels = new Map<string, SharedChannel>();
const registry = new RealtimeChannelRegistry<any>();

const isDev = import.meta.env.DEV;

const buildChannelKey = (
  schema: string,
  table: string,
  event: Event,
  filter?: string
) => `${schema}:${table}:${event}:${filter ?? ''}`;

/**
 * Subscribe to postgres_changes for a given table. Reuses an existing channel
 * if one already exists for the same (schema, table, event, filter) tuple.
 *
 * Returns an unsubscribe function. Calling it (or `unsubscribeByKey`) is
 * idempotent and safe to call multiple times.
 */
export function subscribeToTable(opts: SubscribeOptions): () => void {
  const schema = opts.schema ?? 'public';
  const event = opts.event ?? '*';
  const channelKey = buildChannelKey(schema, opts.table, event, opts.filter);

  // If this caller key already exists, replace it to avoid stale listeners.
  if (keyIndex.has(opts.key)) {
    unsubscribeByKey(opts.key);
  }

  let shared = channels.get(channelKey);
  if (!shared) {
    const channelName = `shared:${channelKey}:${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase.channel(channelName);

    const fanOut: SharedChannel = {
      channel,
      channelKey,
    };

    try {
      channel.on(
        'postgres_changes',
        {
          event,
          schema,
          table: opts.table,
          ...(opts.filter ? { filter: opts.filter } : {}),
        },
        (payload: any) => {
          registry.emit(channelKey, payload);
        }
      );

      channel.subscribe((status) => {
        if (!isDev) return;
        if (status === 'SUBSCRIBED') {
          console.log(`[realtimeChannels] subscribed → ${channelKey}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(`[realtimeChannels] ${status} → ${channelKey}`);
        }
      });
    } catch (err: any) {
      // Never let a realtime subscription failure break rendering/data loading.
      if (isDev) console.warn(`[realtimeChannels] subscribe failed → ${channelKey}: ${err?.message ?? err}`);
      try {
        supabase.removeChannel(channel);
      } catch {
        /* ignore */
      }
      return () => {};
    }

    channels.set(channelKey, fanOut);
    shared = fanOut;
    if (isDev) console.log(`[realtimeChannels] channel created → ${channelKey}`);
  }

  const registrationId = registry.add(channelKey, opts.key, (payload) => {
    try {
      opts.callback(payload);
    } catch (err: any) {
      if (isDev) console.error(`[realtimeChannels] listener error on ${channelKey}:`, err?.message ?? err);
    }
  });

  return () => unsubscribeRegistration(opts.key, registrationId);
}

/**
 * Remove a previously-registered listener by its unique key. Tears down the
 * underlying channel when no listeners remain.
 */
export function unsubscribeByKey(key: string): void {
  unsubscribeRegistration(key);
}

function unsubscribeRegistration(key: string, expectedRegistrationId?: number): void {
  const removal = registry.remove(key, expectedRegistrationId);
  if (!removal) return;
  const shared = channels.get(removal.channelKey);
  if (!shared) return;

  if (removal.isEmpty) {
    try {
      supabase.removeChannel(shared.channel);
    } catch (err: any) {
      if (isDev) console.warn(`[realtimeChannels] removeChannel error: ${err?.message ?? err}`);
    }
    channels.delete(removal.channelKey);
    if (isDev) console.log(`[realtimeChannels] channel torn down → ${removal.channelKey}`);
  }
}

/** Convenience: subscribe to several tables under one base key. */
export function subscribeToTables(
  baseKey: string,
  tables: Array<{
    table: string;
    schema?: 'public' | 'demo';
    event?: Event;
    filter?: string;
  }>,
  callback: (table: string, payload: any) => void
): () => void {
  const unsubs = tables.map((t) =>
    subscribeToTable({
      key: `${baseKey}:${t.schema ?? 'public'}:${t.table}:${t.event ?? '*'}:${t.filter ?? ''}`,
      table: t.table,
      schema: t.schema,
      event: t.event,
      filter: t.filter,
      callback: (payload) => callback(t.table, payload),
    })
  );

  return () => {
    unsubs.forEach((u) => {
      try {
        u();
      } catch {
        /* idempotent */
      }
    });
  };
}

/** Diagnostics — handy in DevTools / tests. */
export function getActiveChannelStats(): { channels: number; listeners: number } {
  let listeners = 0;
  channels.forEach((_, channelKey) => {
    listeners += registry.listenerCount(channelKey);
  });
  return { channels: channels.size, listeners };
}
