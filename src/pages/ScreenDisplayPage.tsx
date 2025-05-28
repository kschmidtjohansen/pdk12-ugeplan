
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Compressed Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link to="/planner">
              <Button variant="outline" size="sm" className="hover:bg-gray-50">
                <Home className="h-4 w-4 mr-1" />
                {t('common.back')}
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {t('planner.title')}
              </h1>
              <div className="flex items-center gap-2 text-lg text-gray-600">
                <Calendar className="h-5 w-5" />
                {formatDate(selectedDate)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {format(currentTime, 'HH:mm')}
            </div>
            <div className="text-sm text-gray-600">
              {format(currentTime, 'EEEE', { locale: currentLanguage === 'da' ? da : undefined })}
            </div>
          </div>
        </div>

        {/* Compressed Date Navigation */}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={handlePreviousDay} variant="outline" size="sm" className="px-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {currentLanguage === 'da' ? 'Forrige' : 'Previous'}
          </Button>
          <Button onClick={handleToday} variant="default" size="sm" className="px-6 bg-blue-600 hover:bg-blue-700">
            {t('planner.today')}
          </Button>
          <Button onClick={handleNextDay} variant="outline" size="sm" className="px-4">
            {currentLanguage === 'da' ? 'Næste' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Compressed Assignments Display */}
      {todayAssignments.length === 0 ? (
        <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">
              {t('planner.nothingPlannedToday')}
            </h2>
            <p className="text-lg text-gray-500">
              {currentLanguage === 'da' ? 'Ingen opgaver planlagt for denne dag' : 'No assignments scheduled for this day'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {todayAssignments.map((assignment, index) => {
            const status = getTimeStatus(assignment);
            return (
              <Card key={assignment.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          {assignment.title}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{t('planner.assignmentTime')}</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatTime(assignment.fromTime)} - {formatTime(assignment.toTime)}
                            </p>
                          </div>
                        </div>

                        {assignment.location && (
                          <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-2 rounded-full">
                              <MapPin className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">{t('planner.location')}</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {assignment.location}
                              </p>
                            </div>
                          </div>
                        )}

                        {assignment.employees && assignment.employees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="bg-purple-100 p-2 rounded-full">
                              <Users className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">{t('planner.employees')}</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {assignment.employees.join(', ')}
                              </p>
                            </div>
                          </div>
                        )}

                        {assignment.car && (
                          <div className="flex items-center gap-2">
                            <div className="bg-orange-100 p-2 rounded-full">
                              <Car className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">{t('planner.car')}</p>
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {assignment.description && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {t('planner.description')}:
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
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
