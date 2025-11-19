import React from 'react';
import { Shield, Car, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyData } from '@/hooks/duty/useDutyData';
import { startOfWeek, endOfWeek } from 'date-fns';

const DutySummaryWidget: React.FC = () => {
  const { t } = useTranslation();
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
    <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer group">
      <Link to="/duty" className="block">
        <CardHeader className="py-2 px-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg font-semibold text-primary">
                {t('duty.currentWeekDuty')}
              </CardTitle>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="p-2 space-y-1.5">
          {loading ? (
            <div className="text-xs text-muted-foreground py-1">
              {t('common.loading')}...
            </div>
          ) : !skadelederDuty && !kørevagt ? (
            <div className="text-xs text-muted-foreground py-2">
              {t('duty.noDutySelected')}
            </div>
          ) : (
            <>
              {skadelederDuty && (
                <div className="flex items-center gap-1.5 py-1">
                  <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {t('duty.skadelederVagt')}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {getDisplayName(skadelederDuty)}
                    </div>
                  </div>
                </div>
              )}
              {kørevagt && (
                <div className="flex items-center gap-1.5 py-1">
                  <Car className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {t('duty.kørevagt')}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {getDisplayName(kørevagt)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Link>
    </Card>
  );
};

export default DutySummaryWidget;

