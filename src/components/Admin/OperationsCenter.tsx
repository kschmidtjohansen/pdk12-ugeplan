import React, { useCallback, useMemo, useState } from 'react';
import { Activity, BellRing, Clock, ExternalLink, Gauge, RefreshCw, Server, CalendarX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import WorkspaceSection from '@/components/shared/WorkspaceSection';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ListSkeleton from '@/components/shared/ListSkeleton';
import { useTranslation } from '@/context/TranslationContext';
import { useBroadcastCampaigns } from '@/hooks/useBroadcastCampaigns';
import { useAutoPublishLog } from '@/hooks/useAutoPublishLog';
import { getRealtimeChannelDiagnostics } from '@/lib/realtimeChannels';
import {
  CAMPAIGN_QUERY_LIMIT,
  aggregatePushDelivery,
  formatRate,
  summarizeAutoPublish,
  summarizeRealtimeClient,
  type OperationsPeriod,
} from '@/utils/operationsCenter';
import { cn } from '@/lib/utils';

interface OperationsCenterProps {
  /** Opens the existing broadcast tab with BroadcastDeliveryStatus (legit retries live there). */
  onOpenBroadcast: () => void;
  onOpenWebVitals?: () => void;
}

const fmt = (iso: string | null | number | undefined, locale: string) => {
  if (iso === null || iso === undefined || iso === 0) return '–';
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '–';
};

function Kpi({ label, value, hint, tone = 'neutral' }: { label: string; value: React.ReactNode; hint?: string; tone?: 'neutral' | 'success' | 'warning' | 'error' }) {
  return (
    <div className="min-w-0 px-3 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 text-xl font-semibold tabular-nums',
        tone === 'success' && 'text-success-soft-foreground',
        tone === 'warning' && 'text-warning-soft-foreground',
        tone === 'error' && 'text-destructive-soft-foreground')}>{value}</dd>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const OperationsCenter: React.FC<OperationsCenterProps> = ({ onOpenBroadcast, onOpenWebVitals }) => {
  const { currentLanguage } = useTranslation();
  const da = currentLanguage !== 'en';
  const locale = da ? 'da-DK' : 'en-GB';
  const [period, setPeriod] = useState<OperationsPeriod>(30);

  const campaignsQ = useBroadcastCampaigns();
  const autoQ = useAutoPublishLog(10);
  const [realtimeSnapshot, setRealtimeSnapshot] = useState(() => ({ at: Date.now(), diag: getRealtimeChannelDiagnostics() }));

  const push = useMemo(() => aggregatePushDelivery(campaignsQ.data, period), [campaignsQ.data, period]);
  const auto = useMemo(() => summarizeAutoPublish(autoQ.data), [autoQ.data]);
  const rt = useMemo(() => summarizeRealtimeClient(realtimeSnapshot.diag), [realtimeSnapshot]);

  const refreshing = campaignsQ.isFetching || autoQ.isFetching;
  const refresh = useCallback(() => {
    void campaignsQ.refetch();
    void autoQ.refetch();
    setRealtimeSnapshot({ at: Date.now(), diag: getRealtimeChannelDiagnostics() });
  }, [campaignsQ, autoQ]);

  const periodLabel = period === 'all'
    ? (da ? `Seneste ${CAMPAIGN_QUERY_LIMIT} udsendelser` : `Latest ${CAMPAIGN_QUERY_LIMIT} broadcasts`)
    : (da ? `Seneste ${period} dage (inden for de seneste ${CAMPAIGN_QUERY_LIMIT} udsendelser)` : `Last ${period} days (within the latest ${CAMPAIGN_QUERY_LIMIT} broadcasts)`);

  const periods: Array<{ key: OperationsPeriod; label: string }> = [
    { key: 7, label: da ? '7 dage' : '7 days' },
    { key: 30, label: da ? '30 dage' : '30 days' },
    { key: 'all', label: da ? `Seneste ${CAMPAIGN_QUERY_LIMIT}` : `Latest ${CAMPAIGN_QUERY_LIMIT}` },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{da ? 'Driftscenter' : 'Operations center'}</h2>
          <p className="text-xs text-muted-foreground">
            {da ? 'Kun data appen faktisk har adgang til. Ukendt vises aldrig som OK.' : 'Only data the app can actually read. Unknown is never shown as OK.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label={da ? 'Periode' : 'Period'} className="inline-flex rounded-md border border-border">
            {periods.map((p) => (
              <Button key={String(p.key)} variant="ghost" size="sm" aria-pressed={period === p.key}
                onClick={() => setPeriod(p.key)}
                className={cn('min-h-11 rounded-none px-3 text-xs first:rounded-l-md last:rounded-r-md', period === p.key && 'bg-accent text-foreground')}>
                {p.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing} className="min-h-11 gap-2">
            <RefreshCw aria-hidden className={cn('h-4 w-4', refreshing && 'motion-safe:animate-spin')} />
            {refreshing ? (da ? 'Opdaterer…' : 'Refreshing…') : (da ? 'Opdater data' : 'Refresh data')}
          </Button>
          <span className="text-[11px] text-muted-foreground tabular-nums" aria-live="polite">
            {da ? 'Hentet' : 'Fetched'} {fmt(campaignsQ.dataUpdatedAt || null, locale)}
          </span>
        </div>
      </div>

      {/* 1. Push */}
      <WorkspaceSection
        title={da ? 'Push-meddelelser' : 'Push notifications'}
        meta={periodLabel}
        description={da
          ? '"Accepteret" betyder at push-udbyderen modtog beskeden — ikke at den blev vist på telefonen.'
          : '"Accepted" means the push provider received the message — not that it was shown on the phone.'}
        actions={
          <Button variant="outline" size="sm" onClick={onOpenBroadcast} className="min-h-11 gap-2">
            <BellRing aria-hidden className="h-4 w-4" />
            {da ? 'Åbn leveringsstatus' : 'Open delivery status'}
          </Button>
        }
        flush
      >
        {campaignsQ.isLoading ? (
          <div className="p-3"><ListSkeleton rowCount={2} /></div>
        ) : campaignsQ.isError ? (
          <div className="p-3">
            <ErrorState title={da ? 'Kunne ikke hente udsendelser' : 'Could not load broadcasts'}
              description={campaignsQ.error instanceof Error ? campaignsQ.error.message : undefined} onRetry={refresh} retrying={refreshing} />
          </div>
        ) : push.campaignCount === 0 ? (
          <EmptyState compact icon={<BellRing />} title={da ? 'Ingen målinger' : 'No measurements'}
            description={da ? 'Ingen udsendelser i den valgte periode.' : 'No broadcasts in the selected period.'} />
        ) : (
          <>
            <dl className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
              <Kpi label={da ? 'Leveringsrate' : 'Delivery rate'} value={formatRate(push.deliveryRate)}
                hint={push.deliveryRate === null
                  ? (da ? 'Ukendt – ingen forsøg med resultat' : 'Unknown – no attempts with result')
                  : (da ? `${push.accepted} accepteret / ${push.attemptsWithResult} forsøg med resultat` : `${push.accepted} accepted / ${push.attemptsWithResult} attempts with result`)} />
              <Kpi label={da ? 'Accepteret' : 'Accepted'} value={push.accepted} tone={push.accepted > 0 ? 'success' : 'neutral'} />
              <Kpi label={da ? 'Fejlet' : 'Failed'} value={push.failed} tone={push.failed > 0 ? 'error' : 'neutral'} />
              <Kpi label={da ? 'Intet abonnement' : 'No subscription'} value={push.noSubscription} />
              <Kpi label={da ? 'Fravalgt' : 'Opted out'} value={push.skipped} />
              <Kpi label={da ? 'Afventer' : 'Pending'} value={push.pending} tone={push.pending > 0 ? 'warning' : 'neutral'} />
            </dl>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-3 py-2 text-[11px] text-muted-foreground tabular-nums sm:px-4">
              <span>{da ? 'Udsendelser' : 'Broadcasts'}: {push.campaignCount}</span>
              <span>{da ? 'Modtagere' : 'Recipients'}: {push.recipients}</span>
              <span>{da ? 'Dateres kun' : 'Covers only'} {fmt(push.oldest, locale)} – {fmt(push.newest, locale)}</span>
              {push.unknownCampaigns > 0 && <span>{da ? 'Ukendt status' : 'Unknown status'}: {push.unknownCampaigns}</span>}
              {push.limitReached && <span>{da ? `Ældre end de seneste ${CAMPAIGN_QUERY_LIMIT} er ikke medtaget` : `Older than latest ${CAMPAIGN_QUERY_LIMIT} not included`}</span>}
            </div>
            {push.failedCampaigns.length > 0 && (
              <ul className="divide-y divide-border border-t border-border" aria-label={da ? 'Udsendelser med fejl' : 'Broadcasts with failures'}>
                {push.failedCampaigns.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2 sm:px-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">{c.title}</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">{fmt(c.created_at, locale)}</p>
                    </div>
                    <StatusBadge variant="error" dot>{c.failed} {da ? 'fejlet' : 'failed'}</StatusBadge>
                  </li>
                ))}
                <li className="px-3 py-2 text-[11px] text-muted-foreground sm:px-4">
                  {da ? 'Gensend fejlede via "Åbn leveringsstatus" — her bekræftes hver gensendelse.' : 'Resend failed ones via "Open delivery status" — each resend is confirmed there.'}
                </li>
              </ul>
            )}
          </>
        )}
      </WorkspaceSection>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 2. Auto-publish */}
        <WorkspaceSection title={da ? 'Automatisk publicering' : 'Auto-publish'}
          meta={da ? 'Valgt afdeling · seneste 10' : 'Selected department · latest 10'}>
          {autoQ.isLoading ? <ListSkeleton rowCount={2} /> : autoQ.isError ? (
            <ErrorState title={da ? 'Kunne ikke hente kørsler' : 'Could not load runs'} onRetry={refresh} />
          ) : auto.state === 'no_data' ? (
            <EmptyState compact icon={<Clock />} title={da ? 'Ingen målinger' : 'No measurements'}
              description={da ? 'Ingen registrerede kørsler for afdelingen.' : 'No recorded runs for this department.'} />
          ) : (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">{da ? 'Seneste kørsel' : 'Latest run'}</dt><dd className="tabular-nums">{fmt(auto.latest?.run_at, locale)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{da ? 'Resultat' : 'Result'}</dt><dd className="tabular-nums">{auto.latest?.assignments_updated ?? '–'} {da ? 'opgaver publiceret' : 'tasks published'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{da ? 'Udløst af' : 'Triggered by'}</dt><dd>{auto.latest?.triggered_by ?? '–'}</dd></div>
              <div><dt className="text-xs text-muted-foreground">{da ? 'Kørsler i listen' : 'Runs listed'}</dt><dd className="tabular-nums">{auto.runs}</dd></div>
            </dl>
          )}
        </WorkspaceSection>

        {/* Realtime (this browser only) */}
        <WorkspaceSection title={da ? 'Realtime – denne browser' : 'Realtime – this browser'}
          description={da ? 'Måler kun denne browsers forbindelser — ikke serverjob eller produktionen generelt.' : 'Measures only this browser\u2019s connections — not server jobs or production overall.'}
          meta={`${da ? 'Øjebliksbillede' : 'Snapshot'} ${fmt(realtimeSnapshot.at, locale)}`}>
          <div className="flex flex-wrap items-center gap-3">
            <Activity aria-hidden className="h-4 w-4 text-muted-foreground" />
            {rt.state === 'no_channels' ? (
              <StatusBadge variant="default" dot>{da ? 'Ingen aktive kanaler' : 'No active channels'}</StatusBadge>
            ) : rt.state === 'all_subscribed' ? (
              <StatusBadge variant="success" dot>{da ? `Forbundet: ${rt.subscribed}/${rt.channels}` : `Connected: ${rt.subscribed}/${rt.channels}`}</StatusBadge>
            ) : (
              <StatusBadge variant="warning" dot>{da ? `Forbundet: ${rt.subscribed}/${rt.channels} · problemer: ${rt.problems}` : `Connected: ${rt.subscribed}/${rt.channels} · problems: ${rt.problems}`}</StatusBadge>
            )}
          </div>
        </WorkspaceSection>

        {/* 3. Background jobs */}
        <WorkspaceSection title={da ? 'Baggrundsjob (cron)' : 'Background jobs (cron)'}>
          <div className="flex items-start gap-3" data-testid="cron-status">
            <Server aria-hidden className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <StatusBadge variant="default" dot>{da ? 'Ikke overvåget' : 'Not monitored'}</StatusBadge>
              <p className="text-xs text-muted-foreground">
                {da ? 'Kræver sikker server-side statuskilde. Se driftsrunbook: ' : 'Requires a secure server-side status source. See runbook: '}
                <code className="text-[11px]">docs/operations/driftscenter.md</code>
              </p>
            </div>
          </div>
        </WorkspaceSection>

        {/* 4. Outlook */}
        <WorkspaceSection title={da ? 'Outlook-synk' : 'Outlook sync'}>
          <div className="flex items-center gap-3">
            <CalendarX aria-hidden className="h-4 w-4 text-muted-foreground" />
            <StatusBadge variant="default" dot>{da ? 'Ikke konfigureret' : 'Not configured'}</StatusBadge>
          </div>
        </WorkspaceSection>
      </div>

      {/* 7. Web Vitals link — no extra query */}
      {onOpenWebVitals && (
        <WorkspaceSection title="Web Vitals"
          description={da ? 'Målinger fra rigtige brugersessioner vises i deres egen fane for at undgå en ekstra tung forespørgsel her.' : 'Field measurements live in their own tab to avoid another heavy query here.'}
          actions={
            <Button variant="outline" size="sm" onClick={onOpenWebVitals} className="min-h-11 gap-2">
              <Gauge aria-hidden className="h-4 w-4" />{da ? 'Åbn Web Vitals' : 'Open Web Vitals'}<ExternalLink aria-hidden className="h-3 w-3" />
            </Button>
          }>
          <p className="text-xs text-muted-foreground">{da ? 'Ingen målinger hentet i Driftscenteret.' : 'No measurements loaded in the operations center.'}</p>
        </WorkspaceSection>
      )}
    </div>
  );
};

export default OperationsCenter;
