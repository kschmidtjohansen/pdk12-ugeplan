
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { useAssignments } from '@/hooks/useAssignments';
import { useViewSpecificFilters } from '@/hooks/useViewSpecificFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Home, Calendar, Clock, MapPin, Users, Car } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { Assignment } from '@/types/assignment';
import { Link } from 'react-router-dom';

const ScreenDisplayPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const { assignments } = useAssignments();
  const { filterForScreenDisplay } = useViewSpecificFilters();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filter assignments for screen display (only published assignments)
  const filteredAssignments = filterForScreenDisplay(assignments);

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
  const todayAssignments = filteredAssignments.filter(a => a.date === selectedDateStr && a.published).sort((a, b) => a.fromTime.localeCompare(b.fromTime));

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
      case 'active':
        return 'bg-green-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return currentLanguage === 'da' ? 'Igangværende' : 'In Progress';
      case 'upcoming':
        return currentLanguage === 'da' ? 'Kommende' : 'Upcoming';
      case 'completed':
        return currentLanguage === 'da' ? 'Færdig' : 'Completed';
      default:
        return currentLanguage === 'da' ? 'Planlagt' : 'Scheduled';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-1">
      {/* Ultra-compact Header for TV - Kann-Bann Style */}
      <div className="bg-white rounded shadow-sm p-1 mb-1 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link to="/planner">
              <Button variant="outline" size="sm" className="text-xs px-1 py-0.5 h-6">
                <Home className="h-2 w-2" />
              </Button>
            </Link>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">
                Storskærmvisning
              </h1>
              <div className="text-xs text-gray-600 leading-tight">
                {formatDate(selectedDate)}
              </div>
            </div>
          </div>
          <div className="text-right">
            
            
          </div>
        </div>

        {/* Ultra-compact Date Navigation */}
        <div className="flex items-center justify-center gap-1 mt-1">
          <Button onClick={handlePreviousDay} variant="outline" size="sm" className="px-1 py-0.5 text-xs h-6">
            <ChevronLeft className="h-2 w-2" />
          </Button>
          <Button onClick={handleToday} variant="default" size="sm" className="px-2 py-0.5 text-xs h-6 bg-blue-600 hover:bg-blue-700">
            {t('planner.today')}
          </Button>
          <Button onClick={handleNextDay} variant="outline" size="sm" className="px-1 py-0.5 text-xs h-6">
            <ChevronRight className="h-2 w-2" />
          </Button>
        </div>
      </div>

      {/* Ultra-compact Assignments Display - Kann-Bann Grid Layout for TV */}
      {todayAssignments.length === 0 ? (
        <Card className="bg-white rounded shadow-sm border border-gray-200">
          <CardContent className="p-2 text-center">
            <div className="text-lg mb-1">📅</div>
            <h2 className="text-sm font-semibold text-gray-600 leading-tight">
              {t('planner.nothingPlannedToday')}
            </h2>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-1">
          {todayAssignments.map((assignment, index) => {
            const status = getTimeStatus(assignment);
            return (
              <Card key={assignment.id} className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <CardContent className="p-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-900 truncate flex-1">
                        {assignment.title}
                      </h3>
                      <div className={`px-1 py-0.5 rounded text-white text-xs font-medium ${getStatusColor(status)} ml-1`}>
                        {getStatusText(status)}
                      </div>
                    </div>
                    
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <div className="bg-blue-100 p-0.5 rounded">
                          <Clock className="h-2 w-2 text-blue-600" />
                        </div>
                        <p className="text-xs font-semibold text-gray-900">
                          {formatTime(assignment.fromTime)}-{formatTime(assignment.toTime)}
                        </p>
                      </div>

                      {assignment.location && (
                        <div className="flex items-center gap-1">
                          <div className="bg-green-100 p-0.5 rounded">
                            <MapPin className="h-2 w-2 text-green-600" />
                          </div>
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {assignment.location}
                          </p>
                        </div>
                      )}

                      {assignment.employees && assignment.employees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="bg-purple-100 p-0.5 rounded">
                            <Users className="h-2 w-2 text-purple-600" />
                          </div>
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {assignment.employees.join(', ')}
                          </p>
                        </div>
                      )}

                      {assignment.car && (
                        <div className="flex items-center gap-1">
                          <div className="bg-orange-100 p-0.5 rounded">
                            <Car className="h-2 w-2 text-orange-600" />
                          </div>
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
                          </p>
                        </div>
                      )}
                    </div>

                    {assignment.description && (
                      <div className="bg-gray-50 p-1 rounded">
                        <p className="text-xs text-gray-700 leading-tight line-clamp-2">
                          {assignment.description}
                        </p>
                      </div>
                    )}
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
