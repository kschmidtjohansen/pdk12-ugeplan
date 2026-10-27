/**
 * Pure aggregation helpers for the admin "Driftscenter" (operations center).
 * Only fields that exist on broadcast_campaigns / auto_publish_log are used.
 * Missing or invalid numbers are never treated as success.
 */
import type { BroadcastCampaign } from '@/hooks/useBroadcastCampaigns';
import type { AutoPublishLogEntry } from '@/hooks/useAutoPublishLog';
import type { RealtimeChannelDiagnostic } from '@/lib/realtimeChannels';

/** Must match the .limit() in useBroadcastCampaigns. */
export const CAMPAIGN_QUERY_LIMIT = 50;

export type OperationsPeriod = 7 | 30 | 'all';

/** Only super_admin: the campaign query has no department filter beyond RLS, and
 * auto_publish_log RLS is not department-scoped for administrators. */
export const canOpenOperationsCenter = (role: string | null | undefined): boolean =>
  role === 'super_admin';

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;

export interface PushDeliverySummary {
  campaignCount: number;
  recipients: number;
  accepted: number;
  failed: number;
  noSubscription: number;
  skipped: number;
  pending: number;
  /** Campaigns with missing/invalid counters — counted as unknown, never success. */
  unknownCampaigns: number;
  /** accepted + failed: attempts with an actual provider result. */
  attemptsWithResult: number;
  /** accepted / attemptsWithResult, or null when there is no denominator. */
  deliveryRate: number | null;
  oldest: string | null;
  newest: string | null;
  /** True when the source query returned the full limit, so older data may exist. */
  limitReached: boolean;
  failedCampaigns: Array<{ id: string; title: string; created_at: string; failed: number }>;
}

export function filterByPeriod<T extends { created_at: string }>(
  rows: readonly T[],
  period: OperationsPeriod,
  now: Date = new Date()
): T[] {
  if (period === 'all') return [...rows];
  const cutoff = now.getTime() - period * 24 * 60 * 60 * 1000;
  return rows.filter((r) => {
    const t = new Date(r.created_at).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}

export function aggregatePushDelivery(
  allCampaigns: readonly BroadcastCampaign[] | null | undefined,
  period: OperationsPeriod = 'all',
  now: Date = new Date()
): PushDeliverySummary {
  const source = allCampaigns ?? [];
  const campaigns = filterByPeriod(source, period, now);
  const s: PushDeliverySummary = {
    campaignCount: campaigns.length,
    recipients: 0, accepted: 0, failed: 0, noSubscription: 0, skipped: 0, pending: 0,
    unknownCampaigns: 0, attemptsWithResult: 0, deliveryRate: null,
    oldest: null, newest: null,
    limitReached: source.length >= CAMPAIGN_QUERY_LIMIT,
    failedCampaigns: [],
  };
  for (const c of campaigns) {
    const total = num(c.total_recipients);
    const sent = num(c.push_sent);
    const failed = num(c.push_failed);
    const skipped = num(c.push_skipped_preference);
    const noSub = num(c.push_no_subscription);
    if (total === null || sent === null || failed === null || skipped === null || noSub === null) {
      s.unknownCampaigns += 1;
      continue;
    }
    s.recipients += total;
    s.accepted += sent;
    s.failed += failed;
    s.skipped += skipped;
    s.noSubscription += noSub;
    s.pending += Math.max(0, total - (sent + failed + skipped + noSub));
    if (failed > 0) s.failedCampaigns.push({ id: c.id, title: c.title, created_at: c.created_at, failed });
    if (!s.newest || c.created_at > s.newest) s.newest = c.created_at;
    if (!s.oldest || c.created_at < s.oldest) s.oldest = c.created_at;
  }
  s.attemptsWithResult = s.accepted + s.failed;
  s.deliveryRate = s.attemptsWithResult > 0 ? s.accepted / s.attemptsWithResult : null;
  return s;
}

export interface AutoPublishSummary {
  state: 'no_data' | 'has_runs';
  latest: AutoPublishLogEntry | null;
  runs: number;
  assignmentsPublished: number;
}

export function summarizeAutoPublish(entries: readonly AutoPublishLogEntry[] | null | undefined): AutoPublishSummary {
  const list = entries ?? [];
  if (list.length === 0) return { state: 'no_data', latest: null, runs: 0, assignmentsPublished: 0 };
  const latest = [...list].sort((a, b) => (a.run_at < b.run_at ? 1 : -1))[0];
  return {
    state: 'has_runs',
    latest,
    runs: list.length,
    assignmentsPublished: list.reduce((sum, e) => sum + (num(e.assignments_updated) ?? 0), 0),
  };
}

export interface RealtimeClientSummary {
  state: 'no_channels' | 'all_subscribed' | 'degraded';
  channels: number;
  subscribed: number;
  problems: number;
}

export function summarizeRealtimeClient(diag: readonly RealtimeChannelDiagnostic[]): RealtimeClientSummary {
  const subscribed = diag.filter((d) => d.status === 'SUBSCRIBED').length;
  const problems = diag.filter((d) => ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(d.status)).length;
  return {
    state: diag.length === 0 ? 'no_channels' : subscribed === diag.length ? 'all_subscribed' : 'degraded',
    channels: diag.length,
    subscribed,
    problems,
  };
}

/** Background jobs (pg_cron) are not exposed to the client. Never report healthy. */
export const BACKGROUND_JOB_STATUS = 'unmonitored' as const;
/** Outlook sync is not implemented. */
export const OUTLOOK_SYNC_STATUS = 'not_configured' as const;

export const formatRate = (rate: number | null): string =>
  rate === null ? '–' : `${Math.round(rate * 1000) / 10}%`;
