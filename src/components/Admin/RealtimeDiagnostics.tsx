import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Radio } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import {
  getRealtimeChannelDiagnostics,
  type RealtimeChannelDiagnostic,
} from '@/lib/realtimeChannels';

const statusVariant = (status: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
  if (status === 'SUBSCRIBED') return 'default';
  if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') return 'destructive';
  if (status === 'CLOSED') return 'outline';
  return 'secondary';
};

export const RealtimeDiagnostics: React.FC = () => {
  const { t } = useTranslation();
  const [channels, setChannels] = useState<RealtimeChannelDiagnostic[]>([]);
  const [serviceWorkers, setServiceWorkers] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const refresh = useCallback(() => {
    setChannels(getRealtimeChannelDiagnostics());
    setUpdatedAt(new Date());
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => setServiceWorkers(regs.length))
        .catch(() => setServiceWorkers(null));
    } else {
      setServiceWorkers(0);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 5000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const totalListeners = channels.reduce((sum, c) => sum + c.listeners, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            {t('admin.realtimeDiagnostics.title')}
          </CardTitle>
          <CardDescription>{t('admin.realtimeDiagnostics.description')}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="gap-2 shrink-0">
          <RefreshCw className="h-4 w-4" />
          {t('admin.realtimeDiagnostics.refresh')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{t('admin.realtimeDiagnostics.activeChannels')}</p>
            <p className="text-2xl font-semibold">{channels.length}</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{t('admin.realtimeDiagnostics.totalListeners')}</p>
            <p className="text-2xl font-semibold">{totalListeners}</p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{t('admin.realtimeDiagnostics.serviceWorkers')}</p>
            <p className="text-2xl font-semibold">{serviceWorkers ?? '—'}</p>
          </div>
        </div>

        {channels.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {t('admin.realtimeDiagnostics.noChannels')}
          </p>
        ) : (
          <div className="divide-y rounded-xl border">
            {channels.map((c) => (
              <div key={c.channelKey} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {c.schema}.{c.table}
                    <span className="ml-2 text-xs text-muted-foreground">{c.event}</span>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.filter ? `${t('admin.realtimeDiagnostics.filter')}: ${c.filter} · ` : ''}
                    {t('admin.realtimeDiagnostics.listeners')}: {c.listeners}
                  </p>
                </div>
                <Badge variant={statusVariant(c.status)} className="shrink-0">
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {t('admin.realtimeDiagnostics.updatedAt')}: {updatedAt.toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
};

export default RealtimeDiagnostics;
