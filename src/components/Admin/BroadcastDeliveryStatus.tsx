import React, { useState } from 'react';
import { BarChart3, CheckCircle2, XCircle, Clock, BellOff, Smartphone, Eye, RefreshCw, Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import ErrorState from '@/components/shared/ErrorState';
import ListSkeleton from '@/components/shared/ListSkeleton';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import {
  useBroadcastCampaigns,
  useBroadcastRecipients,
  useResendFailed,
  type BroadcastCampaign,
  type PushDeliveryStatus,
} from '@/hooks/useBroadcastCampaigns';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  className: string;
}

const Stat: React.FC<StatProps> = ({ icon, label, value, className }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${className}`}
  >
    {icon}
    <span className="tabular-nums">{value}</span>
    <span className="hidden sm:inline font-normal">{label}</span>
  </span>
);

const RecipientsDialog: React.FC<{
  campaign: BroadcastCampaign | null;
  onClose: () => void;
}> = ({ campaign, onClose }) => {
  const { t } = useTranslation();
  const { data: recipients, isLoading, error } = useBroadcastRecipients(campaign?.id ?? null);

  return (
    <Dialog open={!!campaign} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-sm:left-0 max-sm:top-auto max-sm:bottom-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-w-full max-sm:rounded-t-2xl">
        <DialogHeader>
          <DialogTitle>{t('admin.broadcast.delivery.detailsTitle')}</DialogTitle>
          <DialogDescription className="truncate">{campaign?.title}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[55vh] pr-3">
          {isLoading && <ListSkeleton rowCount={5} />}
          {!isLoading && error && <ErrorState />}
          {!isLoading && !error && (recipients?.length ?? 0) === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('admin.broadcast.delivery.noRecipients')}
            </p>
          )}
          <ul className="space-y-1">
            {(recipients ?? []).map((r) => (
              <li
                key={r.user_id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name || r.email}</p>
                  {r.name && r.email && (
                    <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className={
                    r.read
                      ? 'bg-success-soft text-success-soft-foreground shrink-0'
                      : 'shrink-0 text-muted-foreground'
                  }
                >
                  {r.read
                    ? t('admin.broadcast.delivery.statusRead')
                    : t('admin.broadcast.delivery.statusUnread')}
                </Badge>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const BroadcastDeliveryStatus: React.FC = () => {
  const { t } = useTranslation();
  const { userDepartments } = useDepartment();
  const { data: campaigns, isLoading, error, refetch, isFetching } = useBroadcastCampaigns();
  const [selected, setSelected] = useState<BroadcastCampaign | null>(null);

  const departmentName = (id: string | null) =>
    id
      ? userDepartments.find((d) => d.id === id)?.name ?? '—'
      : t('admin.broadcast.delivery.allDepartments');

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('admin.broadcast.delivery.title')}
          </CardTitle>
          <CardDescription>{t('admin.broadcast.delivery.description')}</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="touch-target shrink-0"
          onClick={() => refetch()}
          aria-label={t('admin.broadcast.delivery.refresh')}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <ListSkeleton rowCount={3} variant="card" />}
        {!isLoading && error && <ErrorState onRetry={() => refetch()} />}
        {!isLoading && !error && (campaigns?.length ?? 0) === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('admin.broadcast.delivery.empty')}
          </p>
        )}

        {(campaigns ?? []).map((c) => {
          const accounted =
            c.push_sent + c.push_failed + c.push_skipped_preference + c.push_no_subscription;
          const pending = Math.max(0, c.total_recipients - accounted);

          return (
            <div
              key={c.id}
              className="rounded-xl border border-border/60 p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.title}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.message}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="touch-target shrink-0"
                  onClick={() => setSelected(c)}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  {t('admin.broadcast.delivery.details')}
                </Button>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatDateTime(c.created_at)}
                {c.created_by_name ? ` · ${c.created_by_name}` : ''} · {departmentName(c.department_id)}
                {' · '}
                {c.roles.length > 0 ? c.roles.join(', ') : t('admin.broadcast.delivery.allRoles')}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Stat
                  icon={<Smartphone className="h-3.5 w-3.5" />}
                  label={t('admin.broadcast.delivery.recipients')}
                  value={c.total_recipients}
                  className="bg-muted text-muted-foreground"
                />
                <Stat
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  label={t('admin.broadcast.delivery.sent')}
                  value={c.push_sent}
                  className="bg-success-soft text-success-soft-foreground"
                />
                {c.push_failed > 0 && (
                  <Stat
                    icon={<XCircle className="h-3.5 w-3.5" />}
                    label={t('admin.broadcast.delivery.failed')}
                    value={c.push_failed}
                    className="bg-destructive-soft text-destructive"
                  />
                )}
                {c.push_no_subscription > 0 && (
                  <Stat
                    icon={<BellOff className="h-3.5 w-3.5" />}
                    label={t('admin.broadcast.delivery.noPush')}
                    value={c.push_no_subscription}
                    className="bg-warning-soft text-warning-soft-foreground"
                  />
                )}
                {c.push_skipped_preference > 0 && (
                  <Stat
                    icon={<BellOff className="h-3.5 w-3.5" />}
                    label={t('admin.broadcast.delivery.skipped')}
                    value={c.push_skipped_preference}
                    className="bg-warning-soft text-warning-soft-foreground"
                  />
                )}
                {pending > 0 && (
                  <Stat
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label={t('admin.broadcast.delivery.pending')}
                    value={pending}
                    className="bg-muted text-muted-foreground"
                  />
                )}
              </div>
            </div>
          );
        })}
      </CardContent>

      <RecipientsDialog campaign={selected} onClose={() => setSelected(null)} />
    </Card>
  );
};

export default BroadcastDeliveryStatus;
