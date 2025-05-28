
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
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
  const todayAssignments = assignments.filter(a => a.date === selectedDateStr);

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/planner">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                {t('common.back')}
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-gray-800">
              {t('planner.title')} - {formatDate(selectedDate)}
            </h1>
          </div>
          <div className="text-2xl font-semibold text-gray-600">
            {format(currentTime, 'HH:mm')}
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-center mt-6 gap-4">
          <Button onClick={handlePreviousDay} variant="outline" size="lg">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {t('planner.previousDays')}
          </Button>
          <Button onClick={handleToday} variant="outline" size="lg">
            {t('planner.today')}
          </Button>
          <Button onClick={handleNextDay} variant="outline" size="lg">
            {t('planner.nextWeek')}
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Assignments Display */}
      <div className="space-y-6">
        {todayAssignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <h2 className="text-3xl font-semibold text-gray-600">
              {t('planner.nothingPlannedToday')}
            </h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {todayAssignments
              .sort((a, b) => a.fromTime.localeCompare(b.fromTime))
              .map((assignment) => (
                <div key={assignment.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {assignment.title}
                      </h3>
                      <p className="text-lg text-gray-600 mb-2">
                        {formatTime(assignment.fromTime)} - {formatTime(assignment.toTime)}
                      </p>
                      {assignment.location && (
                        <p className="text-lg text-gray-600 mb-2">
                          📍 {assignment.location}
                        </p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      assignment.published 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {assignment.published ? t('planner.published') : t('planner.notPublished')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {assignment.employees && assignment.employees.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-1">
                          👥 {t('planner.employees')}:
                        </h4>
                        <p className="text-lg text-gray-600">
                          {assignment.employees.join(', ')}
                        </p>
                      </div>
                    )}

                    {assignment.car && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-1">
                          🚗 {t('planner.car')}:
                        </h4>
                        <p className="text-lg text-gray-600">
                          {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
                        </p>
                      </div>
                    )}

                    {assignment.description && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-1">
                          📝 {t('planner.description')}:
                        </h4>
                        <p className="text-lg text-gray-600">
                          {assignment.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenDisplayPage;
