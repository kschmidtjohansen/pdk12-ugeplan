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
      className="relative overflow-hidden transition-[border-color,box-shadow] duration-200 border-l-4 border-l-purple-500 shadow-md hover:shadow-lg cursor-pointer bg-gradient-to-br from-card to-card/50 border-2 border-border/50 hover:border-purple-300 hover:shadow-purple-500/20"
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {t('duty.todayDuties')}
        </CardTitle>
        <div className="p-2 rounded-xl border bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300">
          <Phone className="h-4 w-4" />
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-3">
        {loading ? (
          <div className="text-xs text-muted-foreground">
            {t('common.loading')}...
          </div>
        ) : (
          <>
            <div className="text-xl font-bold">
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

