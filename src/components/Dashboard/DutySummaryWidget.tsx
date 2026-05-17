import React from 'react';
import { Phone, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyData } from '@/hooks/duty/useDutyData';
import { startOfWeek, endOfWeek } from 'date-fns';

const DutySummaryWidget: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  const { duties, loading } = useDutyData(weekStart, weekEnd);

  const todayStr = today.toISOString().split('T')[0];
  const todayDuties = duties.filter(duty => duty.duty_date === todayStr);
  const skadelederDuty = todayDuties.find(d => d.duty_type === 'skadeleder_vagt');
  const kørevagt = todayDuties.find(d => d.duty_type === 'kørevagt');

  const getDisplayName = (duty: typeof skadelederDuty) => {
    if (!duty) return 'Ukendt';
    if (duty.employee?.name) return duty.employee.name;
    if (duty.notes?.startsWith('EKSTERN:')) {
      return duty.notes.split('\n')[0].replace('EKSTERN: ', '');
    }
    return 'Ukendt';
  };

  return (
    <Card
      className="relative overflow-hidden transition-colors duration-150 cursor-pointer hover:bg-accent/40 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-info"
      onClick={() => navigate('/duty')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate('/duty');
        }
      }}
    >
      <CardHeader className="brand-card-header flex flex-row items-center justify-between space-y-0 px-4 pl-5 pt-3">
        <CardTitle className="text-sm font-semibold brand-dot">
          {t('duty.todayDuties')}
        </CardTitle>
        <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
          <Phone className="h-4 w-4" />
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pl-5 pb-3">
        {loading ? (
          <div className="text-xs text-muted-foreground">
            {t('common.loading')}...
          </div>
        ) : (
          <>
            <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {todayDuties.length}
            </div>
            
            {todayDuties.length > 0 ? (
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                {skadelederDuty && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-blue-600 shrink-0" />
                    <span className="truncate">{getDisplayName(skadelederDuty)}</span>
                  </div>
                )}
                {kørevagt && (
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-green-600 shrink-0" />
                    <span className="truncate">{getDisplayName(kørevagt)}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground mt-1">
                {t('duty.noDutySelected')}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DutySummaryWidget;

