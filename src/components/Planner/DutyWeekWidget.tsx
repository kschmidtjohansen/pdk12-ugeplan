import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyData } from '@/hooks/duty/useDutyData';
import { Phone, Car, ChevronDown, ChevronUp } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import type { Duty } from '@/types/duty';

interface DutyWeekWidgetProps {
  selectedWeek: number;
  selectedYear: number;
}

export const DutyWeekWidget = ({ selectedWeek, selectedYear }: DutyWeekWidgetProps) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : enUS;
  const navigate = useNavigate();

  const [isRestOfWeekCollapsed, setIsRestOfWeekCollapsed] = useState(() => {
    const saved = localStorage.getItem('dutyWeekRestCollapsed');
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('dutyWeekRestCollapsed', JSON.stringify(isRestOfWeekCollapsed));
  }, [isRestOfWeekCollapsed]);

  // Helper to extract initials from external entry notes
  const getExternalInitials = (notes: string | null | undefined): string => {
    if (!notes?.startsWith('EKSTERN:')) return '?';
    
    const match = notes.match(/\[([A-Z]{1,2})\]/);
    if (match) return match[1];
    
    const name = notes.split('\n')[0].replace('EKSTERN: ', '');
    return name.split(/\s+/).map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');
  };

  // Helper to get initials from a name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper to get display name from duty
  const getDisplayName = (duty: Duty): string => {
    if (duty.employee?.name) return duty.employee.name;
    if (duty.notes?.startsWith('EKSTERN:')) {
      return duty.notes.split('\n')[0].replace('EKSTERN: ', '').replace(/\s*\[.*?\]\s*/, '').trim();
    }
    return 'Ukendt';
  };

  // Calculate week start and end dates
  const firstDayOfYear = new Date(selectedYear, 0, 1);
  const daysOffset = (selectedWeek - 1) * 7;
  const weekStart = startOfWeek(new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  const { duties, loading } = useDutyData(weekStart, weekEnd);

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getDutiesForDay = (date: Date): { skadeleder?: Duty; kørevagt?: Duty } => {
    const dayDuties = duties.filter(duty => 
      isSameDay(new Date(duty.duty_date), date)
    );

    return {
      skadeleder: dayDuties.find(d => d.duty_type === 'skadeleder_vagt'),
      kørevagt: dayDuties.find(d => d.duty_type === 'kørevagt'),
    };
  };

  if (loading) {
    return (
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="py-2 px-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg font-semibold text-primary">
              {t('duty.currentWeekDuty')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            {t('common.loading')}...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 border-primary/20">
      <CardHeader className="py-2 px-4 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg font-semibold text-primary">
              {t('duty.currentWeekDuty')}
            </CardTitle>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate('/duty')}
            className="text-sm text-primary hover:underline transition-colors h-auto p-0"
          >
            {t('duty.viewAll')}
          </Button>
        </div>
    </CardHeader>

    <CardContent className="p-4 space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">
              {t('common.loading')}...
            </div>
          ) : duties.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {t('duty.noDutySelected')}
            </div>
          ) : (
            <>
              {/* Today's duties - always visible */}
              {(() => {
                const today = new Date();
                const { skadeleder, kørevagt } = getDutiesForDay(today);
                const hasTodayDuties = skadeleder || kørevagt;

                if (!hasTodayDuties) {
                  return (
                    <div className="text-sm text-muted-foreground">
                      {t('duty.noDutySelected')}
                    </div>
                  );
                }

                return (
                  <div 
                    className="border-l-2 border-primary pl-3 py-2 bg-primary/5"
                  >
                    <div className="text-sm font-semibold mb-2 text-primary">
                      {format(today, 'EEEE dd.MM.yy', { locale })}
                    </div>

                    <div className="space-y-2">
                      {skadeleder && (
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="gap-1">
                            <Phone className="h-3 w-3" />
                            {t('duty.skadelederVagt')}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            {skadeleder.employee ? (
                              <>
                                {skadeleder.employee.avatar_url && (
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={skadeleder.employee.avatar_url} />
                                    <AvatarFallback className="text-[10px]">
                                      {skadeleder.employee.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <span className="text-xs">{skadeleder.employee.name}</span>
                              </>
                            ) : (
                              <>
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    {getExternalInitials(skadeleder.notes)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{getDisplayName(skadeleder)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {kørevagt && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                            <Car className="h-3 w-3" />
                            {t('duty.kørevagt')}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            {kørevagt.employee ? (
                              <>
                                {kørevagt.employee.avatar_url && (
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={kørevagt.employee.avatar_url} />
                                    <AvatarFallback className="text-[10px]">
                                      {kørevagt.employee.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <span className="text-xs">{kørevagt.employee.name}</span>
                              </>
                            ) : (
                              <>
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    {getExternalInitials(kørevagt.notes)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{getDisplayName(kørevagt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Rest of week - collapsible */}
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const restOfWeekDays = weekDays.filter(day => !isSameDay(day, today));
                
                // Split into future and past days
                const futureDays = restOfWeekDays.filter(day => day > today).sort((a, b) => a.getTime() - b.getTime());
                const pastDays = restOfWeekDays.filter(day => day < today).sort((a, b) => b.getTime() - a.getTime());
                
                // Count duties in both future and past
                const futureDutiesCount = futureDays.filter(day => {
                  const { skadeleder, kørevagt } = getDutiesForDay(day);
                  return skadeleder || kørevagt;
                }).length;
                
                const pastDutiesCount = pastDays.filter(day => {
                  const { skadeleder, kørevagt } = getDutiesForDay(day);
                  return skadeleder || kørevagt;
                }).length;
                
                const restOfWeekDuties = futureDutiesCount + pastDutiesCount;

                if (restOfWeekDuties === 0) return null;

                return (
                  <Collapsible
                    open={!isRestOfWeekCollapsed}
                    onOpenChange={() => setIsRestOfWeekCollapsed(!isRestOfWeekCollapsed)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between p-2 h-auto"
                      >
                        <span className="text-sm font-medium">
                          Resten af ugen ({restOfWeekDuties} {restOfWeekDuties === 1 ? 'dag' : 'dage'})
                        </span>
                        {isRestOfWeekCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Future duties */}
            {futureDays.map(day => {
              const { skadeleder, kørevagt } = getDutiesForDay(day);
              const hasDuties = skadeleder || kørevagt;
              
              if (!hasDuties) return null;

              return (
                <div key={day.toISOString()} className="border-l-2 border-primary/30 pl-3 py-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {format(day, 'EEEE d. MMMM', { locale })}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {skadeleder && (
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="gap-1">
                            <Phone className="h-3 w-3" />
                            {t('duty.skadelederVagt')}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={skadeleder.employee?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getExternalInitials(skadeleder.notes) || getInitials(skadeleder.employee?.name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{getDisplayName(skadeleder)}</span>
                          </div>
                        </div>
                      )}

                      {kørevagt && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="gap-1">
                            <Car className="h-3 w-3" />
                            {t('duty.kørevagt')}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={kørevagt.employee?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getExternalInitials(kørevagt.notes) || getInitials(kørevagt.employee?.name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{getDisplayName(kørevagt)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Separator if we have both future and past */}
            {futureDutiesCount > 0 && pastDutiesCount > 0 && (
              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 border-t border-border"></div>
                <span className="text-xs text-muted-foreground">
                  {currentLanguage === 'da' ? 'Tidligere denne uge' : 'Earlier this week'}
                </span>
                <div className="flex-1 border-t border-border"></div>
              </div>
            )}
            
            {/* Past duties */}
            {pastDays.map(day => {
              const { skadeleder, kørevagt } = getDutiesForDay(day);
              const hasDuties = skadeleder || kørevagt;
              
              if (!hasDuties) return null;

              return (
                <div key={day.toISOString()} className="border-l-2 border-muted/50 pl-3 py-2 opacity-60">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {format(day, 'EEEE d. MMMM', { locale })}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {skadeleder && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Phone className="h-3 w-3" />
                            {t('duty.skadelederVagt')}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={skadeleder.employee?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getExternalInitials(skadeleder.notes) || getInitials(skadeleder.employee?.name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{getDisplayName(skadeleder)}</span>
                          </div>
                        </div>
                      )}

                      {kørevagt && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Car className="h-3 w-3" />
                            {t('duty.kørevagt')}
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={kørevagt.employee?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getExternalInitials(kørevagt.notes) || getInitials(kørevagt.employee?.name || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{getDisplayName(kørevagt)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CollapsibleContent>
                  </Collapsible>
                );
              })()}
            </>
          )}
        </CardContent>
      </Card>
  );
};
