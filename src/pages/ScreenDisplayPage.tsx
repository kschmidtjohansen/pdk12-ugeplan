
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Home, Calendar, Clock, MapPin, Users, Car } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { Assignment } from '@/types/assignment';
import { Link } from 'react-router-dom';

const ScreenDisplayPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const { assignments } = usePlannerAssignments();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const locale = currentLanguage === 'da' ? da : undefined;
    return format(date, 'EEEE, d. MMMM yyyy', { locale });
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayAssignments = assignments
    .filter(a => a.date === selectedDateStr && a.published)
    .sort((a, b) => a.fromTime.localeCompare(b.fromTime));

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const getTimeStatus = (assignment: Assignment) => {
    const now = new Date();
    const currentTimeStr = format(now, 'HH:mm');
    const isToday = format(now, 'yyyy-MM-dd') === assignment.date;
    
    if (!isToday) return 'scheduled';
    
    if (currentTimeStr < assignment.fromTime) return 'upcoming';
    if (currentTimeStr >= assignment.fromTime && currentTimeStr <= assignment.toTime) return 'active';
    return 'completed';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return currentLanguage === 'da' ? 'Igangværende' : 'In Progress';
      case 'upcoming': return currentLanguage === 'da' ? 'Kommende' : 'Upcoming';
      case 'completed': return currentLanguage === 'da' ? 'Færdig' : 'Completed';
      default: return currentLanguage === 'da' ? 'Planlagt' : 'Scheduled';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2">
      {/* Ultra-compact Header for TV */}
      <div className="bg-white rounded-lg shadow-md p-2 mb-2 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link to="/planner">
              <Button variant="outline" size="sm" className="text-xs px-2 py-1">
                <Home className="h-3 w-3 mr-1" />
                {t('common.back')}
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 mb-0">
                {t('planner.title')}
              </h1>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="h-3 w-3" />
                {formatDate(selectedDate)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">
              {format(currentTime, 'HH:mm')}
            </div>
            <div className="text-xs text-gray-600">
              {format(currentTime, 'EEEE', { locale: currentLanguage === 'da' ? da : undefined })}
            </div>
          </div>
        </div>

        {/* Ultra-compact Date Navigation */}
        <div className="flex items-center justify-center gap-2">
          <Button onClick={handlePreviousDay} variant="outline" size="sm" className="px-2 py-1 text-xs">
            <ChevronLeft className="h-3 w-3 mr-1" />
            {currentLanguage === 'da' ? 'Forrige' : 'Previous'}
          </Button>
          <Button onClick={handleToday} variant="default" size="sm" className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700">
            {t('planner.today')}
          </Button>
          <Button onClick={handleNextDay} variant="outline" size="sm" className="px-2 py-1 text-xs">
            {currentLanguage === 'da' ? 'Næste' : 'Next'}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Ultra-compact Assignments Display - Grid Layout for TV */}
      {todayAssignments.length === 0 ? (
        <Card className="bg-white rounded-lg shadow-md border border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">📅</div>
            <h2 className="text-lg font-semibold text-gray-600 mb-1">
              {t('planner.nothingPlannedToday')}
            </h2>
            <p className="text-sm text-gray-500">
              {currentLanguage === 'da' ? 'Ingen opgaver planlagt for denne dag' : 'No assignments scheduled for this day'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2">
          {todayAssignments.map((assignment, index) => {
            const status = getTimeStatus(assignment);
            return (
              <Card key={assignment.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <CardContent className="p-2">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-gray-900 truncate">
                          {assignment.title}
                        </h3>
                        <div className={`px-2 py-0.5 rounded-full text-white text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1 mb-2">
                        <div className="flex items-center gap-1">
                          <div className="bg-blue-100 p-1 rounded">
                            <Clock className="h-3 w-3 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">
                              {formatTime(assignment.fromTime)} - {formatTime(assignment.toTime)}
                            </p>
                          </div>
                        </div>

                        {assignment.location && (
                          <div className="flex items-center gap-1">
                            <div className="bg-green-100 p-1 rounded">
                              <MapPin className="h-3 w-3 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900 truncate">
                                {assignment.location}
                              </p>
                            </div>
                          </div>
                        )}

                        {assignment.employees && assignment.employees.length > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="bg-purple-100 p-1 rounded">
                              <Users className="h-3 w-3 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900 truncate">
                                {assignment.employees.join(', ')}
                              </p>
                            </div>
                          </div>
                        )}

                        {assignment.car && (
                          <div className="flex items-center gap-1">
                            <div className="bg-orange-100 p-1 rounded">
                              <Car className="h-3 w-3 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-900 truncate">
                                {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {assignment.description && (
                        <div className="bg-gray-50 p-1 rounded text-left">
                          <p className="text-xs text-gray-700 leading-tight">
                            {assignment.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScreenDisplayPage;
