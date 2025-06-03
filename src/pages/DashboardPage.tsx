
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock, ArrowRight, Sparkles } from 'lucide-react';
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

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { assignments } = usePlannerAssignments();
  const { employees } = useEmployees();
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

  // Update employee leave status based on vacations when dashboard loads
  useEffect(() => {
    const updateEmployeeStatuses = async () => {
      const { useEmployeeActions } = await import('@/hooks/employee/useEmployeeActions');
      const { updateEmployeeLeaveStatusFromVacations } = useEmployeeActions(() => Promise.resolve());
      await updateEmployeeLeaveStatusFromVacations();
    };
    
    updateEmployeeStatuses();
    
    const intervalId = setInterval(() => {
      updateEmployeeStatuses();
    }, 30 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

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

  // Get assignments for the selected week and user
  const userWeekAssignments = filterForDashboard(assignments).filter(assignment => {
    const assignmentDate = assignment.date;
    const isInWeek = assignmentDate >= startDateISO && assignmentDate <= endDateISO;
    return isInWeek;
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
      icon: <Clock className="h-8 w-8" />,
      description: t('dashboard.quickAccess.planner.description'),
      link: '/planner',
      color: 'blue'
    }, {
      title: t('dashboard.quickAccess.vacation.title'),
      icon: <Calendar className="h-8 w-8" />,
      description: t('dashboard.quickAccess.vacation.description'),
      link: '/vacation',
      color: 'green'
    }];

    if (user?.role === 'administrator' || user?.role === 'skadeleder') {
      baseItems.push({
        title: t('dashboard.quickAccess.employees.title'),
        icon: <Users className="h-8 w-8" />,
        description: t('dashboard.quickAccess.employees.description'),
        link: '/employees',
        color: 'purple'
      }, {
        title: t('dashboard.quickAccess.cars.title'),
        icon: <Car className="h-8 w-8" />,
        description: t('dashboard.quickAccess.cars.description'),
        link: '/cars',
        color: 'orange'
      });
    }
    return baseItems;
  };

  const shouldShowMetrics = user?.role === 'administrator' || user?.role === 'skadeleder';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full p-6 space-y-8">
        {/* Enhanced Welcome Header with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white shadow-2xl animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform -translate-x-16 translate-y-16"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {t('dashboard.welcome', { name: user?.name })}
                </h1>
              </div>
              <p className="text-blue-100 text-lg font-medium">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-right">
          {getQuickAccessItems().map((item, index) => (
            <Link key={index} to={item.link} className="block group">
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] bg-gradient-to-br from-card to-card/50">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
                      item.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' :
                      item.color === 'green' ? 'bg-green-50 text-green-600 group-hover:bg-green-100' :
                      item.color === 'purple' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-100' :
                      'bg-orange-50 text-orange-600 group-hover:bg-orange-100'
                    }`}>
                      {item.icon}
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 group-hover:translate-x-1" />
                  </div>
                  <h3 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors duration-300">
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
        <Card className="border-2 border-border/50 shadow-2xl bg-gradient-to-br from-card to-card/50 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="pb-6">
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {t('dashboard.myAssignments', { week: selectedWeek })}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Manage your weekly schedule and assignments
                  </p>
                </div>
                <WeekNavigation 
                  onPrevious={handlePreviousWeek}
                  onNext={handleNextWeek}
                  currentWeek={selectedWeek}
                />
              </div>
              <Button variant="gradient" size="sm" asChild className="shadow-lg hover:shadow-xl">
                <Link to="/planner">
                  {t('dashboard.viewAll')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userWeekAssignments.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                  {t('dashboard.noAssignments')}
                </h3>
                <p className="text-muted-foreground">
                  No assignments scheduled for this week
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {userWeekAssignments.map((assignment, index) => (
                  <div 
                    key={assignment.id} 
                    className="border-2 border-border/50 rounded-2xl p-8 bg-gradient-to-br from-card to-card/50 transition-all duration-300 cursor-pointer animate-scale-in relative overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => handleAssignmentClick(assignment)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                    
                    <div className="relative z-10">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <h3 className="font-bold text-2xl text-left transition-colors">
                          {assignment.location}
                        </h3>
                        <div className="px-4 py-2 bg-primary/10 text-primary rounded-full font-semibold text-sm border border-primary/20">
                          {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                        </div>
                      </div>
                      
                      {assignment.description && (
                        <p className="text-muted-foreground mb-4 text-left leading-relaxed">{assignment.description}</p>
                      )}
                      <p className="text-foreground mb-6 font-medium text-left text-lg">{assignment.title}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {assignment.car && (
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                              <Car className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="text-foreground font-medium">
                              {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                            <Clock className="h-5 w-5 text-green-600" />
                          </div>
                          <span className="text-foreground font-medium">
                            {assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}
                          </span>
                        </div>
                        
                        {assignment.employees && assignment.employees.length > 0 && (
                          <div className="flex items-center gap-4 sm:col-span-2">
                            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                              <Users className="h-5 w-5 text-purple-600" />
                            </div>
                            <span className="text-foreground font-medium">
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
