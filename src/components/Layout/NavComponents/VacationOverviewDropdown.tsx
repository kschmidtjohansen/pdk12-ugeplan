import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Check, X, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/context/TranslationContext';
import { useVacations } from '@/hooks/useVacations';
import { useVacationApprovalActions } from '@/hooks/vacation/useVacationApprovalActions';
import { useVacationData } from '@/hooks/vacation/useVacationData';
import { format } from 'date-fns';
import { da, enGB } from 'date-fns/locale';

const VacationOverviewDropdown: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();
  const { vacations } = useVacations();
  const { fetchVacations } = useVacationData();
  const { approveVacation, rejectVacation, isLoading } =
    useVacationApprovalActions(fetchVacations);

  const locale = currentLanguage === 'da' ? da : enGB;

  const pending = useMemo(
    () =>
      vacations
        .filter((v) => v.status === 'pending')
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label={t('navigation.vacation')}
        >
          <CalendarDays className="h-[15px] w-[15px]" />
          {pending.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold tabular-nums px-1 h-4 min-w-[16px]">
              {pending.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {t('dashboard.vacationNotifications') || 'Ferieanmodninger'}
          </h3>
          {pending.length > 0 && (
            <Badge variant="solidPrimary" size="sm">
              {pending.length}
            </Badge>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Inbox className="h-7 w-7 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {t('dashboard.noPendingRequests') || 'Ingen afventende anmodninger'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border max-h-[320px] overflow-y-auto">
            {pending.slice(0, 8).map((v) => (
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

        <div className="px-3 py-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-primary hover:text-primary"
            onClick={() => navigate('/vacation')}
          >
            {t('vacation.openVacationPage') || 'Se alle fridage'} →
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default VacationOverviewDropdown;
