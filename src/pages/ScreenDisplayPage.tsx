
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAssignmentsConsolidated } from '@/hooks/useAssignmentsConsolidated';
import { useTranslation } from '@/context/TranslationContext';
import { Clock, MapPin, Users, Car, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isToday, isSameDay } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { Assignment } from '@/types/assignment';
import { getCarDisplayText } from '@/utils/carHelpers';

const ScreenDisplayPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const { assignments, loading } = useAssignmentsConsolidated({ 
    filter: 'all',
    showUnpublished: false
  });
  
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const locale = currentLanguage === 'da' ? da : enUS;
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const formatTime = (time: string): string => {
    return time.substring(0, 5);
  };

  const formatDate = (date: Date): string => {
    return format(date, 'd. MMM', { locale });
  };

  const getDayName = (date: Date): string => {
    return format(date, 'EEEE', { locale });
  };

  const getAssignmentsForDay = (date: Date): Assignment[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return assignments
      .filter(assignment => assignment.date === dateStr && assignment.published)
      .sort((a, b) => a.fromTime.localeCompare(b.fromTime));
  };

  const getCurrentTimeString = (): string => {
    return format(currentTime, 'HH:mm', { locale });
  };

  const getCurrentDateString = (): string => {
    return format(currentTime, 'EEEE, d. MMMM yyyy', { locale });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl text-blue-600 font-semibold">
          {t('common.loading')}...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {t('screen.assignmentOverview')}
              </h1>
              <p className="text-xl text-gray-600">
                {getCurrentDateString()} • {getCurrentTimeString()}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="lg"
                onClick={handlePreviousWeek}
                className="text-lg px-6 py-3"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-800">
                  {t('screen.week')} {format(currentWeek, 'w', { locale })}
                </div>
                <div className="text-lg text-gray-600">
                  {formatDate(weekStart)} - {formatDate(weekEnd)}
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleNextWeek}
                className="text-lg px-6 py-3"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayAssignments = getAssignmentsForDay(day);
            const isCurrentDay = isToday(day);
            
            return (
              <Card key={day.toISOString()} className={`${isCurrentDay ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'} shadow-lg`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-center">
                    <div className={`text-lg font-semibold ${isCurrentDay ? 'text-blue-700' : 'text-gray-700'}`}>
                      {getDayName(day)}
                    </div>
                    <div className={`text-2xl font-bold ${isCurrentDay ? 'text-blue-800' : 'text-gray-800'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(day, 'MMM', { locale })}
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {dayAssignments.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('screen.noAssignments')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayAssignments.map((assignment) => (
                        <div key={assignment.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-start gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-800 text-sm leading-tight">
                                {assignment.location}
                              </h4>
                              {assignment.title && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {assignment.title}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-green-600" />
                              <span className="text-xs font-medium text-gray-700">
                                {formatTime(assignment.fromTime)} - {formatTime(assignment.toTime)}
                              </span>
                            </div>
                            
                            {assignment.car && (
                              <div className="flex items-center gap-2">
                                <Car className="h-3 w-3 text-orange-600" />
                                <span className="text-xs text-gray-700 truncate">
                                  {getCarDisplayText(assignment.car)}
                                </span>
                              </div>
                            )}
                            
                            {assignment.employees && assignment.employees.length > 0 && (
                              <div className="flex items-start gap-2">
                                <Users className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap gap-1">
                                    {assignment.employees.map((employee, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                                        {employee}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScreenDisplayPage;
