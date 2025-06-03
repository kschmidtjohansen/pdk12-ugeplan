
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import PageHeader from '../components/Layout/PageHeader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { getCurrentWeek } from '@/types/assignment';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import WeekNavigation from '@/components/Dashboard/WeekNavigation';

// Import assignments from planner hook to reuse the mock data
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { getCurrentWeekDates, getCurrentWeekNumber, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/weekDates';
import { useAssignmentFilters } from '@/hooks/useAssignmentFilters';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { assignments } = usePlannerAssignments();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();
  const { filterForDashboard } = useAssignmentFilters();

  // State for week navigation
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekNumber());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Update employee leave status based on vacations when dashboard loads
  useEffect(() => {
    const updateEmployeeStatuses = async () => {
      // Import dynamically to avoid circular dependencies
      const { useEmployeeActions } = await import('@/hooks/employee/useEmployeeActions');
      const { updateEmployeeLeaveStatusFromVacations } = useEmployeeActions(() => Promise.resolve());
      await updateEmployeeLeaveStatusFromVacations();
    };
    
    // Update status on load
    updateEmployeeStatuses();
    
    // Also set up an interval to periodically check for employee status changes
    // This ensures employees are properly marked as available when their vacation ends
    const intervalId = setInterval(() => {
      updateEmployeeStatuses();
    }, 30 * 60 * 1000); // Check every 30 minutes
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Get the dates for the selected week
  const weekDates = getCurrentWeekDates(selectedWeek, selectedYear);

  // Convert start/end dates to ISO strings
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

  // ENHANCED: Get assignments for the selected week and user using dashboard filter with better logging
  const userWeekAssignments = filterForDashboard(assignments).filter(assignment => {
    // Check if assignment is within the selected week
    const assignmentDate = assignment.date;
    const isInWeek = assignmentDate >= startDateISO && assignmentDate <= endDateISO;
    
    console.log(`[DashboardPage] Assignment ${assignment.id} (${assignment.location}):`, {
      date: assignmentDate,
      weekStart: startDateISO,
      weekEnd: endDateISO,
      isInWeek: isInWeek,
      employees: assignment.employees,
      userRole: user?.role
    });
    
    return isInWeek;
  }).sort((a, b) => {
    // Get today's date in YYYY-MM-DD format
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Priority sorting: today first, then future dates, then past dates
    const aIsToday = a.date === today;
    const bIsToday = b.date === today;
    const aIsFuture = a.date > today;
    const bIsFuture = b.date > today;
    const aIsPast = a.date < today;
    const bIsPast = b.date < today;
    
    // Today's assignments at the top
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    
    // Future assignments before past assignments
    if (aIsFuture && bIsPast) return -1;
    if (aIsPast && bIsFuture) return 1;
    
    // Within the same category (today, future, or past), sort by date and time
    if (a.date !== b.date) {
      // For future dates, sort earliest first
      if (aIsFuture && bIsFuture) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      // For past dates, sort latest first (most recent past dates first)
      if (aIsPast && bIsPast) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      // Default date comparison
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    
    // If same date, sort by fromTime (earliest first)
    return a.fromTime.localeCompare(b.fromTime);
  });

  console.log(`[DashboardPage] Final user week assignments for ${user?.name}:`, userWeekAssignments.map(a => ({
    id: a.id,
    location: a.location,
    employees: a.employees,
    date: a.date
  })));

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
      icon: <Clock className="h-10 w-10" />,
      description: t('dashboard.quickAccess.planner.description'),
      link: '/planner'
    }, {
      title: t('dashboard.quickAccess.vacation.title'),
      icon: <Calendar className="h-10 w-10 text-polygon-blue" />,
      description: t('dashboard.quickAccess.vacation.description'),
      link: '/vacation'
    }];

    // Add role-specific items
    if (user?.role === 'administrator' || user?.role === 'skadeleder') {
      baseItems.push({
        title: t('dashboard.quickAccess.employees.title'),
        icon: <Users className="h-10 w-10" />,
        description: t('dashboard.quickAccess.employees.description'),
        link: '/employees'
      }, {
        title: t('dashboard.quickAccess.cars.title'),
        icon: <Car className="h-10 w-10" />,
        description: t('dashboard.quickAccess.cars.description'),
        link: '/cars'
      });
    }
    return baseItems;
  };

  // Show dashboard metrics only for admin or skadeleder
  const shouldShowMetrics = user?.role === 'administrator' || user?.role === 'skadeleder';
  
  return (
    <>
      <PageHeader title={t('dashboard.welcome', {
      name: user?.name
    })} description={t('dashboard.today', {
      date: getFormattedDate(),
      week: getCurrentWeek()
    })} />

      {/* Quick access grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getQuickAccessItems().map((item, index) => <Link key={index} to={item.link} className="block">
            <Card className="h-full hover:border-polygon-blue transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="text-polygon-blue">{item.icon}</div>
                <CardTitle className="mt-2">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-muted-foreground text-sm text-left">{item.description}</p>
              </CardContent>
            </Card>
          </Link>)}
      </div>

      {/* Dashboard metrics for admin/skadeleder */}
      <DashboardMetrics />

      {/* This week's assignments */}
      <Card className="mb-8 mt-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>
                {t('dashboard.myAssignments', {
                  week: selectedWeek
                })}
              </span>
              <WeekNavigation 
                onPrevious={handlePreviousWeek}
                onNext={handleNextWeek}
                currentWeek={selectedWeek}
              />
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/planner">{t('dashboard.viewAll')}</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userWeekAssignments.length === 0 ? (
            <p className="text-left py-8 text-muted-foreground">
              {t('dashboard.noAssignments')}
            </p>
          ) : (
            <div className="grid gap-4">
              {userWeekAssignments.map(assignment => {
                console.log(`[DashboardPage] Rendering assignment ${assignment.id} (${assignment.location}) with employees:`, assignment.employees);
                
                return (
                  <div key={assignment.id} className="border rounded-md p-4 bg-white hover:border-polygon-blue transition-colors">
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-lg text-left">{assignment.location}</h3>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-md">
                        {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                      </span>
                    </div>
                    
                    {/* Description */}
                    {assignment.description && (
                      <p className="text-sm text-gray-600 mb-2 text-left">{assignment.description}</p>
                    )}
                    <p className="text-sm text-gray-600 mb-2 font-medium text-left">{assignment.title}</p>
                    
                    <div className="space-y-2">
                      {/* Car */}
                      {assignment.car && (
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Time */}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}
                        </span>
                      </div>
                      
                      {/* ENHANCED: Always show ALL employees for dashboard "Mine opgaver" */}
                      {assignment.employees && assignment.employees.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {assignment.employees.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default DashboardPage;
