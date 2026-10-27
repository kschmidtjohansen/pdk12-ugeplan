import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_QUERY_LIMIT, aggregatePushDelivery, canOpenOperationsCenter, formatRate,
  summarizeAutoPublish, summarizeRealtimeClient, BACKGROUND_JOB_STATUS,
} from './operationsCenter';
import type { BroadcastCampaign } from '@/hooks/useBroadcastCampaigns';
import type { RealtimeChannelDiagnostic } from '@/lib/realtimeChannels';

const NOW = new Date('2026-10-27T12:00:00Z');
const c = (o: Partial<BroadcastCampaign> = {}): BroadcastCampaign => ({
  id: Math.random().toString(36), created_at: '2026-10-26T10:00:00Z', created_by_name: 'A', department_id: null,
  roles: [], title: 'T', message: 'M', link: null, total_recipients: 10, push_sent: 6, push_failed: 2,
  push_skipped_preference: 1, push_no_subscription: 0, ...o,
});

describe('aggregatePushDelivery', () => {
  it('sums counters and derives pending as remainder', () => {
    const s = aggregatePushDelivery([c()], 'all', NOW);
    expect(s).toMatchObject({ accepted: 6, failed: 2, skipped: 1, noSubscription: 0, pending: 1, recipients: 10 });
  });
  it('delivery rate = accepted / (accepted + failed)', () => {
    const s = aggregatePushDelivery([c()], 'all', NOW);
    expect(s.attemptsWithResult).toBe(8);
    expect(s.deliveryRate).toBe(0.75);
    expect(formatRate(s.deliveryRate)).toBe('75%');
  });
  it('rate is unknown (null) when no attempts had a result', () => {
    const s = aggregatePushDelivery([c({ push_sent: 0, push_failed: 0, push_skipped_preference: 0 })], 'all', NOW);
    expect(s.deliveryRate).toBeNull();
    expect(formatRate(s.deliveryRate)).toBe('–');
  });
  it('invalid counters are counted as unknown, never as accepted', () => {
    const s = aggregatePushDelivery([c({ push_sent: null as unknown as number })], 'all', NOW);
    expect(s.unknownCampaigns).toBe(1);
    expect(s.accepted).toBe(0);
    expect(s.deliveryRate).toBeNull();
  });
  it('flags that the 50-campaign limit was reached', () => {
    expect(CAMPAIGN_QUERY_LIMIT).toBe(50);
    expect(aggregatePushDelivery(Array.from({ length: 50 }, () => c()), 'all', NOW).limitReached).toBe(true);
    expect(aggregatePushDelivery(Array.from({ length: 49 }, () => c()), 'all', NOW).limitReached).toBe(false);
  });
  it('7-day period excludes older campaigns', () => {
    const s = aggregatePushDelivery([c(), c({ created_at: '2026-10-01T10:00:00Z' })], 7, NOW);
    expect(s.campaignCount).toBe(1);
  });
  it('lists campaigns with failures for linking to delivery status', () => {
    const s = aggregatePushDelivery([c({ id: 'x', push_failed: 3 }), c({ push_failed: 0 })], 'all', NOW);
    expect(s.failedCampaigns.map(f => f.id)).toEqual(['x']);
  });
  it('handles null input as empty', () => {
    expect(aggregatePushDelivery(null).campaignCount).toBe(0);
  });
});

describe('access and other signals', () => {
  it('only super_admin may open the operations center', () => {
    expect(canOpenOperationsCenter('super_admin')).toBe(true);
    expect(canOpenOperationsCenter('administrator')).toBe(false);
    expect(canOpenOperationsCenter('skadeleder')).toBe(false);
    expect(canOpenOperationsCenter(undefined)).toBe(false);
  });
  it('auto-publish summary picks newest run', () => {
    const s = summarizeAutoPublish([
      { id: '1', run_at: '2026-10-25T00:00:00Z', assignments_updated: 2, department_id: 'd', triggered_by: 'cron' },
      { id: '2', run_at: '2026-10-26T00:00:00Z', assignments_updated: 3, department_id: 'd', triggered_by: 'cron' },
    ]);
    expect(s.latest?.id).toBe('2');
    expect(s.assignmentsPublished).toBe(5);
    expect(summarizeAutoPublish([]).state).toBe('no_data');
  });
  it('realtime summary reports degraded when a channel is not subscribed', () => {
    const d = (status: string) => ({ status } as RealtimeChannelDiagnostic);
    expect(summarizeRealtimeClient([]).state).toBe('no_channels');
    expect(summarizeRealtimeClient([d('SUBSCRIBED')]).state).toBe('all_subscribed');
    expect(summarizeRealtimeClient([d('SUBSCRIBED'), d('CHANNEL_ERROR')])).toMatchObject({ state: 'degraded', problems: 1 });
  });
  it('background job status is never reported as healthy', () => {
    expect(BACKGROUND_JOB_STATUS).toBe('unmonitored');
  });
});
