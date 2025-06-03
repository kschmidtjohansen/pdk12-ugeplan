
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import PageHeader from '../components/Layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock, MapPin, ArrowRight } from 'lucide-react';
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
    <div className="space-y-8">
      {/* Enhanced Page Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-white shadow-large animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t('dashboard.welcome', { name: user?.name })}
            </h1>
            <p className="text-blue-100 text-lg">
              {t('dashboard.today', {
                date: getFormattedDate(),
                week: todayISOWeek
              })}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-blue-100 text-sm uppercase tracking-wide font-medium">
                {t('dashboard.week')} {todayISOWeek}
              </p>
              <p className="text-2xl font-bold">
                {format(new Date(), 'dd/MM')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick access grid with enhanced cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-right">
        {getQuickAccessItems().map((item, index) => (
          <Link key={index} to={item.link} className="block group">
            <Card className="h-full hover:shadow-large transition-all duration-300 border-0 shadow-soft hover-lift bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${
                    item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                    item.color === 'green' ? 'bg-green-50 text-green-600' :
                    item.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                    'bg-orange-50 text-orange-600'
                  }`}>
                    {item.icon}
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
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

      {/* Dashboard metrics for admin/skadeleder */}
      {shouldShowMetrics && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <DashboardMetrics />
        </div>
      )}

      {/* This week's assignments with enhanced design */}
      <Card className="shadow-medium border-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader className="pb-4">
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl">
                {t('dashboard.myAssignments', { week: selectedWeek })}
              </span>
              <WeekNavigation 
                onPrevious={handlePreviousWeek}
                onNext={handleNextWeek}
                currentWeek={selectedWeek}
              />
            </div>
            <Button variant="outline" size="sm" asChild className="hover:bg-primary hover:text-white transition-colors">
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
              <div className="p-4 rounded-full bg-gray-100 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground text-lg">
                {t('dashboard.noAssignments')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {userWeekAssignments.map((assignment, index) => (
                <div 
                  key={assignment.id} 
                  className="border rounded-xl p-6 bg-gradient-to-r from-white to-gray-50 hover:shadow-medium transition-all duration-200 hover-lift animate-scale-in cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleAssignmentClick(assignment)}
                >
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
                    <h3 className="font-bold text-xl text-left">{assignment.location}</h3>
                    <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                      {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                    </span>
                  </div>
                  
                  {assignment.description && (
                    <p className="text-sm text-gray-600 mb-3 text-left">{assignment.description}</p>
                  )}
                  <p className="text-sm text-gray-700 mb-4 font-medium text-left">{assignment.title}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {assignment.car && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <Car className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">
                        {assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}
                      </span>
                    </div>
                    
                    {assignment.employees && assignment.employees.length > 0 && (
                      <div className="flex items-center gap-3 sm:col-span-2">
                        <div className="p-2 rounded-lg bg-purple-50">
                          <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {assignment.employees.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Details Dialog */}
      <AssignmentDetailsDialog
        assignment={selectedAssignment}
        isOpen={isAssignmentDialogOpen}
        onClose={() => setIsAssignmentDialogOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
