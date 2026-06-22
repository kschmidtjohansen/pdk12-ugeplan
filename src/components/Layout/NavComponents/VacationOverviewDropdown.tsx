import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Check, X, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useTranslation } from '@/context/TranslationContext';
import { useVacations } from '@/hooks/useVacations';
import { useVacationApprovalActions } from '@/hooks/vacation/useVacationApprovalActions';
import { useVacationData } from '@/hooks/vacation/useVacationData';
import { format } from 'date-fns';
import { da, enGB } from 'date-fns/locale';

const VacationOverviewDropdown: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { vacations } = useVacations();
  const { fetchVacations } = useVacationData();
  const { approveVacation, rejectVacation, isLoading } =
    useVacationApprovalActions(fetchVacations);

  const locale = currentLanguage === 'da' ? da : enGB;

  const pending = useMemo(
    () =>
      (vacations ?? [])
        .filter((v) => v?.status === 'pending')
        .sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        ),
    [vacations]
  );

  const formatRange = (start: string, end: string) => {
    const s = format(new Date(start), 'd. MMM', { locale });
    const e = format(new Date(end), 'd. MMM yyyy', { locale });
    return start === end
      ? format(new Date(start), 'd. MMM yyyy', { locale })
      : `${s} – ${e}`;
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 px-2 gap-1.5 rounded-md bg-primary/8 hover:bg-primary/14 text-primary border border-primary/20"
          aria-label={t('navigation.vacation') || 'Oversigt'}
          title={t('navigation.vacation') || 'Oversigt'}
        >
          <CalendarDays className="h-4 w-4" />
          <span
            className={
              'inline-flex items-center justify-center rounded-full text-[10px] font-semibold tabular-nums px-1 h-4 min-w-[16px] ' +
              (pending.length > 0
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-primary/15 text-primary')
            }
          >
            {pending.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-base inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {t('dashboard.vacationNotifications') || 'Ferieanmodninger'}
          </SheetTitle>
          {pending.length > 0 && (
            <Badge variant="solidPrimary" size="sm" className="mx-[30px]">
              {pending.length}
            </Badge>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-2">
          {pending.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Inbox className="h-7 w-7 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {t('dashboard.noPendingRequests') || 'Ingen afventende anmodninger'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {pending.map((v) => (
                <li key={v.id} className="px-3 py-2.5">
                  <div className="mb-1.5">
                    <p className="text-sm font-medium truncate">
                      {v.user?.name || '—'}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {formatRange(v.start_date, v.end_date)}
                    </p>
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
                      {t('dashboard.approve') || 'Godkend'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
                      disabled={isLoading}
                      onClick={() =>
                        rejectVacation(v, t('dashboard.rejected') || 'Afvist')
                      }
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('dashboard.reject') || 'Afvis'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-3 py-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-primary hover:text-primary"
            onClick={() => {
              setOpen(false);
              navigate('/vacation');
            }}
          >
            {t('vacation.openVacationPage') || 'Se alle fridage'} →
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VacationOverviewDropdown;
