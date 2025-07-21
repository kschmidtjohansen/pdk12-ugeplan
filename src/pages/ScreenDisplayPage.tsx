
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { useAssignmentsConsolidated } from '@/hooks/useAssignmentsConsolidated';
import { useViewSpecificFilters } from '@/hooks/useViewSpecificFilters';
import { useCars } from '@/hooks/car';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Home, Calendar, Clock, MapPin, Users, Car } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { Assignment } from '@/types/assignment';
import { Link } from 'react-router-dom';

const ScreenDisplayPage: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  // Use 'all' filter and only get published assignments
  const { assignments, loading } = useAssignmentsConsolidated({ filter: 'all', includeUnpublished: false });
  const { filterForScreenDisplay } = useViewSpecificFilters();
  const { cars } = useCars();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Parse date from URL parameters or default to today
  const getInitialDate = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    if (dateParam) {
      try {
        // Parse the date from the URL parameter
        const parsedDate = parseISO(dateParam);
        return parsedDate;
      } catch (error) {
        console.error('Error parsing date from URL:', dateParam, error);
      }
    }
    
    return new Date();
  };

  const [selectedDate, setSelectedDate] = useState(getInitialDate);

  // Filter assignments for screen display (only published assignments)
  const filteredAssignments = filterForScreenDisplay(assignments);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Listen for URL parameter changes (in case the URL is updated after mount)
  useEffect(() => {
    const handleUrlChange = () => {
      const newDate = getInitialDate();
      setSelectedDate(newDate);
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const formatDate = (date: Date) => {
    const locale = currentLanguage === 'da' ? da : undefined;
    return format(date, 'EEEE, d. MMMM yyyy', { locale });
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    return time.substring(0, 5);
  };

  // CAR FIX: Function to get car names from assignment
  const getCarNames = (assignment: Assignment): string[] => {
    const carNames: string[] = [];
    
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      // New format: multiple cars array with IDs
      assignment.cars.forEach(carId => {
        const car = cars.find(c => c.id === carId);
        if (car) {
          carNames.push(car.name);
        }
      });
    } else if (assignment.car) {
      // Old format: single car
      if (typeof assignment.car === 'string') {
        const car = cars.find(c => c.id === assignment.car);
        if (car) {
          carNames.push(car.name);
        }
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        carNames.push(assignment.car.name);
      }
    }
    
    return carNames;
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayAssignments = filteredAssignments
    .filter(a => {
      const isCorrectDate = a.date === selectedDateStr;
      const isPublished = a.published;
      console.log('[ScreenDisplay] Assignment filter check:', {
        assignmentId: a.id,
        assignmentDate: a.date,
        selectedDate: selectedDateStr,
        isCorrectDate,
        isPublished,
        title: a.title
      });
      return isCorrectDate && isPublished;
    })
    .sort((a, b) => a.fromTime.localeCompare(b.fromTime));

  console.log('[ScreenDisplay] Final filtered assignments for', selectedDateStr, ':', todayAssignments.length);

  const handlePreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    // Update URL to reflect the new date
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('date', format(newDate, 'yyyy-MM-dd'));
    window.history.replaceState({}, '', newUrl.toString());
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    // Update URL to reflect the new date
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('date', format(newDate, 'yyyy-MM-dd'));
    window.history.replaceState({}, '', newUrl.toString());
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    // Update URL to reflect today's date
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('date', format(today, 'yyyy-MM-dd'));
    window.history.replaceState({}, '', newUrl.toString());
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
        return t('screenDisplay.statusActive');
      case 'upcoming':
        return t('screenDisplay.statusUpcoming');
      case 'completed':
        return t('screenDisplay.statusCompleted');
      default:
        return t('screenDisplay.statusScheduled');
    }
  };

  // Show loading state while assignments are being fetched
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-6 py-4 space-y-6">
        {/* Enhanced Header with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-white shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl transform -translate-x-12 translate-y-12"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/planner">
                <Button variant="outline" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {t('screenDisplay.title')}
                </h1>
                <p className="text-blue-100 text-lg font-medium">
                  {formatDate(selectedDate)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={handlePreviousDay} 
                variant="outline" 
                size="sm" 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                onClick={handleToday} 
                variant="outline" 
                size="sm" 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 px-4"
              >
                {t('planner.today')}
              </Button>
              <Button 
                onClick={handleNextDay} 
                variant="outline" 
                size="sm" 
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Assignments Display */}
        {todayAssignments.length === 0 ? (
          <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="p-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                {t('screenDisplay.noTasksPlanned')}
              </h2>
              <p className="text-muted-foreground">
                {t('screenDisplay.noTasksDescription')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {todayAssignments.map((assignment, index) => {
              const status = getTimeStatus(assignment);
              const carNames = getCarNames(assignment);
              
              return (
                <Card 
                  key={assignment.id} 
                  className="border-2 border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                  
                  <CardContent className="p-4 relative z-10">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-gray-900 leading-tight flex-1">
                          {assignment.title}
                        </h3>
                        <div className={`px-2 py-1 rounded-full text-white text-xs font-medium ${getStatusColor(status)} flex-shrink-0`}>
                          {getStatusText(status)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-100 p-1 rounded border border-blue-200">
                            <Clock className="h-3 w-3 text-blue-600" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatTime(assignment.fromTime)}-{formatTime(assignment.toTime)}
                          </p>
                        </div>

                        {assignment.location && (
                          <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1 rounded border border-green-200">
                              <MapPin className="h-3 w-3 text-green-600" />
                            </div>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {assignment.location}
                            </p>
                          </div>
                        )}

                        {assignment.employees && assignment.employees.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="bg-purple-100 p-1 rounded border border-purple-200">
                              <Users className="h-3 w-3 text-purple-600" />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(assignment.employees) 
                                ? assignment.employees.map((employee, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {employee}
                                    </Badge>
                                  ))
                                : (
                                    <Badge variant="secondary" className="text-xs">
                                      {assignment.employees}
                                    </Badge>
                                  )
                              }
                            </div>
                          </div>
                        )}

                        {/* CAR FIX: Display car names properly with support for multiple cars */}
                        {carNames.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="bg-orange-100 p-1 rounded border border-orange-200">
                              <Car className="h-3 w-3 text-orange-600" />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {carNames.map((carName, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {carName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {assignment.description && (
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                          <p className="text-xs text-gray-700 leading-tight line-clamp-3">
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
    </div>
  );
};

export default ScreenDisplayPage;
