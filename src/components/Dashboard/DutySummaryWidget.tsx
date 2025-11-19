import React from 'react';
import { Shield, Car, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyData } from '@/hooks/duty/useDutyData';

const DutySummaryWidget: React.FC = () => {
  const { t } = useTranslation();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const { duties, loading } = useDutyData(today, today);

  const todayDuties = duties.filter(duty => duty.duty_date === todayStr);
  const skadelederDuty = todayDuties.find(d => d.duty_type === 'skadeleder_vagt');
  const kørevagt = todayDuties.find(d => d.duty_type === 'kørevagt');

  return (
    <Card className="overflow-hidden border-2 border-primary/20 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer group">
      <Link to="/duty" className="block">
        <CardHeader className="py-2 px-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-lg font-semibold text-primary">
                {t('duty.title')}
              </CardTitle>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">
              {t('common.loading')}...
            </div>
          ) : !skadelederDuty && !kørevagt ? (
            <div className="text-sm text-muted-foreground">
              {t('duty.noDutySelected')}
            </div>
          ) : (
            <>
              {/* Skadeleder Vagt */}
              {skadelederDuty && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600 shrink-0" />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {skadelederDuty.employee?.avatar_url ? (
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={skadelederDuty.employee.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {skadelederDuty.employee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : null}
                    <span className="text-sm font-medium truncate">
                      {skadelederDuty.employee?.name}
                    </span>
                    <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                      {t('duty.skadelederVagt')}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Kørevagt */}
              {kørevagt && (
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-green-600 shrink-0" />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {kørevagt.employee?.avatar_url ? (
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarImage src={kørevagt.employee.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {kørevagt.employee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : null}
                    <span className="text-sm font-medium truncate">
                      {kørevagt.employee?.name}
                    </span>
                    <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                      {t('duty.kørevagt')}
                    </Badge>
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

