import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock, ArrowRight } from 'lucide-react';
import { format, getISOWeek, getISOWeekYear } from 'date-fns';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import WeekNavigation from '@/components/Dashboard/WeekNavigation';
import AssignmentDetailsDialog from '@/components/Dashboard/AssignmentDetailsDialog';

// Import assignments from planner hook to reuse the mock data
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { getCurrentWeekDates, getCurrentWeekNumber, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/weekDates';
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters';
import { Assignment } from '@/types/assignment';
import { getDailyQuote } from '@/utils/dailyQuotes';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { assignments } = usePlannerAssignments();
  const { employees, updateEmployeeLeaveStatusFromVacations } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();
  const { filterForDashboard } = useAssignmentFilters();
  
  const today = new Date();
  const todayISOWeek = getISOWeek(today);
  const todayISOYear = getISOWeekYear(today);
  const [selectedWeek, setSelectedWeek] = useState(todayISOWeek);
  const [selectedYear, setSelectedYear] = useState(todayISOYear);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  // Get the daily motivational quote
  const dailyQuote = getDailyQuote();

  // Update employee leave status based on vacations when dashboard loads
  useEffect(() => {
    const updateEmployeeStatuses = async () => {
      try {
        if (user?.id) {
          console.log('Updating employee leave status from vacations...');
          await updateEmployeeLeaveStatusFromVacations();
        }
      } catch (error) {
        console.error('Failed to update employee statuses:', error);
      }
    };
    
    updateEmployeeStatuses();
    
    const intervalId = setInterval(() => {
      updateEmployeeStatuses();
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      clearInterval(intervalId);
    };
  }, [user?.id, updateEmployeeLeaveStatusFromVacations]);

  // Get the dates for the selected week
  const weekDates = getCurrentWeekDates(selectedWeek, selectedYear);
  const startDateISO = format(weekDates.start, 'yyyy-MM-dd');
  const endDateISO = format(weekDates.end, 'yyyy-MM-dd');

  // Function to handle navigation to previous week
  const handlePreviousWeek = () => {
    const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  // Function to handle navigation to next week
  const handleNextWeek = () => {
    const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  // Handle assignment click
  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsAssignmentDialogOpen(true);
  };

  // Get assignments for the selected week and user with proper error handling
  const userWeekAssignments = filterForDashboard(assignments).filter(assignment => {
    try {
      const assignmentDate = assignment.date;
      const isInWeek = assignmentDate >= startDateISO && assignmentDate <= endDateISO;
      return isInWeek;
    } catch (error) {
      console.error('Error filtering assignment:', error, assignment);
      return false;
    }
  }).sort((a, b) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const aIsToday = a.date === today;
    const bIsToday = b.date === today;
    const aIsFuture = a.date > today;
    const bIsFuture = b.date > today;
    const aIsPast = a.date < today;
    const bIsPast = b.date < today;
    
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    if (aIsFuture && bIsPast) return -1;
    if (aIsPast && bIsFuture) return 1;
    if (a.date !== b.date) {
      if (aIsFuture && bIsFuture) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (aIsPast && bIsPast) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return a.fromTime.localeCompare(b.fromTime);
  });

  // Format the date based on the current language
  const getFormattedDate = () => {
    return new Date().toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Quick access items based on user role
  const getQuickAccessItems = () => {
    const baseItems = [{
      title: t('dashboard.quickAccess.planner.title'),
      icon: <Clock className="h-6 w-6" />,
      description: t('dashboard.quickAccess.planner.description'),
      link: '/planner',
      color: 'blue'
    }, {
      title: t('dashboard.quickAccess.vacation.title'),
      icon: <Calendar className="h-6 w-6" />,
      description: t('dashboard.quickAccess.vacation.description'),
      link: '/vacation',
      color: 'green'
    }];
    
    if (user?.role === 'administrator' || user?.role === 'skadeleder') {
      baseItems.push({
        title: t('dashboard.quickAccess.employees.title'),
        icon: <Users className="h-6 w-6" />,
        description: t('dashboard.quickAccess.employees.description'),
        link: '/employees',
        color: 'purple'
      }, {
        title: t('dashboard.quickAccess.cars.title'),
        icon: <Car className="h-6 w-6" />,
        description: t('dashboard.quickAccess.cars.description'),
        link: '/cars',
        color: 'orange'
      });
    }
    return baseItems;
  };
  
  const shouldShowMetrics = user?.role === 'administrator' || user?.role === 'skadeleder';
  
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-6">
        {/* Enhanced Welcome Header with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-white shadow-2xl animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent py-0"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform -translate-x-16 translate-y-16"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Hej {user?.name || 'Bruger'}! 👋
                </h1>
              </div>
              <p className="text-blue-100 text-lg font-medium max-w-2xl">
                {dailyQuote}
              </p>
              <p className="text-blue-200 text-sm">
                {t('dashboard.today', {
                date: getFormattedDate(),
                week: todayISOWeek
              })}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="text-right space-y-2">
                <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <p className="text-blue-100 text-sm uppercase tracking-wider font-semibold">
                    {t('dashboard.week')} {todayISOWeek}
                  </p>
                  <p className="text-2xl font-bold">
                    {format(new Date(), 'dd/MM')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in-right">
          {getQuickAccessItems().map((item, index) => (
            <Link key={index} to={item.link} className="block group">
              <Card className="h-full border-2">
                <CardContent className="p-4 py-[12px] px-[20px]">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${
                      item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                      item.color === 'green' ? 'bg-green-50 text-green-600' :
                      item.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {item.icon}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-base mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Enhanced Dashboard Metrics */}
        {shouldShowMetrics && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <DashboardMetrics />
          </div>
        )}

        {/* Enhanced Weekly Assignments */}
        <Card 
          style={{ animationDelay: '0.4s' }}
          className="border-2 border-border/50 bg-gradient-to-br from-card to-card"
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {t('dashboard.myAssignments', { week: selectedWeek })}
                  </h2>
                </div>
                <WeekNavigation 
                  onPrevious={handlePreviousWeek} 
                  onNext={handleNextWeek} 
                  currentWeek={selectedWeek} 
                />
              </div>
              <Button variant="gradient" size="sm" asChild className="shadow-lg">
                <Link to="/planner">
                  {t('dashboard.viewAll')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userWeekAssignments.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  {t('dashboard.noAssignments')}
                </h3>
                <p className="text-muted-foreground">
                  No assignments scheduled for this week
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {userWeekAssignments.map((assignment, index) => (
                  <div 
                    key={assignment.id}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => handleAssignmentClick(assignment)}
                    className="border-2 border-border/50 rounded-2xl p-4 bg-gradient-to-br from-card to-card/50 cursor-pointer animate-scale-in relative overflow-hidden py-[12px]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                    
                    <div className="relative z-10">
                      <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                        <h3 className="font-bold text-lg text-left">
                          {assignment.location}
                        </h3>
                        <div className="px-3 py-1 bg-primary/10 text-primary rounded-full font-semibold text-sm border border-primary/20">
                          {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                        </div>
                      </div>
                      
                      {assignment.description && (
                        <p className="text-muted-foreground mb-2 text-left leading-relaxed text-sm">
                          {assignment.description}
                        </p>
                      )}
                      <p className="text-foreground mb-3 font-medium text-left text-sm">
                        {assignment.title}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {assignment.car && (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200">
                              <Car className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <span className="text-foreground font-medium text-sm">
                              {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-green-50 border border-green-200">
                            <Clock className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <span className="text-foreground font-medium text-sm">
                            {assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}
                          </span>
                        </div>
                        
                        {assignment.employees && assignment.employees.length > 0 && (
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200">
                              <Users className="h-3.5 w-3.5 text-purple-600" />
                            </div>
                            <span className="text-foreground font-medium text-sm">
                              {assignment.employees.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AssignmentDetailsDialog 
          assignment={selectedAssignment}
          isOpen={isAssignmentDialogOpen}
          onClose={() => setIsAssignmentDialogOpen(false)}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
