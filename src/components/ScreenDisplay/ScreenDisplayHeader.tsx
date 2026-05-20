import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/context/TranslationContext';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import type { AbsentEmployee } from '@/hooks/useScreenDisplayAbsences';

interface ScreenDisplayHeaderProps {
  selectedDate: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  absences?: AbsentEmployee[];
}

export const ScreenDisplayHeader: React.FC<ScreenDisplayHeaderProps> = ({
  selectedDate,
  onPreviousDay,
  onNextDay,
  onToday,
  absences = [],
}) => {
  const { t, currentLanguage } = useTranslation();

  const formatDate = (date: Date) => {
    const locale = currentLanguage === 'da' ? da : undefined;
    return format(date, 'EEEE, d. MMMM yyyy', { locale });
  };

  const allNames = absences.map((a) => a.name).join(', ');

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/planner">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('screenDisplay.title')}
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              {formatDate(selectedDate)}
            </p>
          </div>
        </div>

        {absences.length > 0 && (
          <div
            className="inline-flex items-center gap-1.5 max-w-full rounded-full bg-warning text-warning-foreground px-2.5 py-1 text-xs font-medium shadow-xs"
            role="status"
            aria-label={`${t('screenDisplay.absent')} ${absences.length}`}
          >
            <UserX className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-semibold">
              {t('screenDisplay.absent')} ({absences.length}):
            </span>
            <span>{allNames}</span>
          </div>
        )}



        <div className="flex items-center gap-2">
          <Button onClick={onPreviousDay} variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={onToday} variant="outline" size="sm" className="px-4">
            {t('planner.today')}
          </Button>
          <Button onClick={onNextDay} variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
