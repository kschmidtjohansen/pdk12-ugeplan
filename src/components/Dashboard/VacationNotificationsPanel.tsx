import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CalendarCheck, Check, X, Inbox } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useVacations } from '@/hooks/useVacations';
import { useVacationApprovalActions } from '@/hooks/vacation/useVacationApprovalActions';
import { useVacationData } from '@/hooks/vacation/useVacationData';
import { format } from 'date-fns';
import { da, enGB } from 'date-fns/locale';

const VacationNotificationsPanel: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const { vacations } = useVacations();
  const { fetchVacations } = useVacationData();
  const { approveVacation, rejectVacation, isLoading } = useVacationApprovalActions(fetchVacations);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');

  const locale = currentLanguage === 'da' ? da : enGB;

  const { pending, history } = useMemo(() => {
    const pending = vacations
      .filter((v) => v.status === 'pending')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    const history = vacations
      .filter((v) => v.status === 'approved' || v.status === 'rejected')
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 10);
    return { pending, history };
  }, [vacations]);

  const formatRange = (start: string, end: string) => {
    const s = format(new Date(start), 'd. MMM', { locale });
    const e = format(new Date(end), 'd. MMM yyyy', { locale });
    return start === end ? format(new Date(start), 'd. MMM yyyy', { locale }) : `${s} – ${e}`;
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-border brand-card-header flex items-center justify-between">
        <h3 className="text-sm font-semibold brand-dot text-foreground inline-flex items-center">
          {t('dashboard.vacationNotifications')}
        </h3>
        {pending.length > 0 && (
          <Badge variant="solidPrimary" size="sm">{pending.length}</Badge>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'pending' | 'history')} className="w-full">
        <div className="px-3 pt-2">
          <TabsList className="grid grid-cols-2 w-full h-8">
            <TabsTrigger value="pending" className="text-xs">
              {t('dashboard.pendingRequests')}
              {pending.length > 0 && (
                <span className="ml-1.5 text-[10px] tabular-nums opacity-80">({pending.length})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              {t('dashboard.approvalHistory')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="m-0">
          {pending.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t('dashboard.noPendingRequests')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-[320px] overflow-y-auto">
              {pending.map((v) => (
                <li key={v.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{v.user?.name || '—'}</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {formatRange(v.start_date, v.end_date)}
                      </p>
                      {v.reason && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{v.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      className="h-7 text-xs flex-1"
                      disabled={isLoading}
                      onClick={() => approveVacation(v)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t('dashboard.approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1 hover:bg-destructive/8 hover:text-destructive hover:border-destructive/40"
                      disabled={isLoading}
                      onClick={() => rejectVacation(v, t('dashboard.rejected'))}
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('dashboard.reject')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="history" className="m-0">
          {history.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <CalendarCheck className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t('dashboard.noApprovalHistory')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-[320px] overflow-y-auto">
              {history.map((v) => (
                <li key={v.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{v.user?.name || '—'}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {formatRange(v.start_date, v.end_date)}
                    </p>
                  </div>
                  <Badge
                    variant={v.status === 'approved' ? 'success' : 'destructive'}
                    size="sm"
                  >
                    {v.status === 'approved' ? t('dashboard.approved') : t('dashboard.rejected')}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default VacationNotificationsPanel;
