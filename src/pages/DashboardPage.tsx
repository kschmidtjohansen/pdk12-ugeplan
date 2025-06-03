
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

// Use the new dedicated dashboard assignments hook
import { useDashboardAssignments } from '@/hooks/useDashboardAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { getCurrentWeekDates, getCurrentWeekNumber, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/weekDates';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { getAssignmentsForWeek, loading: assignmentsLoading, forceRefresh } = useDashboardAssignments();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();

  // State for week navigation - start with current week but allow navigation to future weeks
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

  console.log(`[DashboardPage] User: ${user?.name} (${user?.role})`);
  console.log(`[DashboardPage] Selected week: ${selectedWeek}/${selectedYear}`);
  console.log(`[DashboardPage] Week dates: ${startDateISO} to ${endDateISO}`);

  // Function to handle navigation to previous week
  const handlePreviousWeek = () => {
    const { week, year } = getPreviousWeekInfo(selectedWeek, selectedYear);
    console.log(`[DashboardPage] Navigating to previous week: ${week}/${year}`);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  // Function to handle navigation to next week
  const handleNextWeek = () => {
    const { week, year } = getNextWeekInfo(selectedWeek, selectedYear);
    console.log(`[DashboardPage] Navigating to next week: ${week}/${year}`);
    setSelectedWeek(week);
    setSelectedYear(year);
  };

  // Function to navigate to Week 23, 2025 (where test assignments are located)
  const navigateToTestWeek = () => {
    console.log(`[DashboardPage] Navigating to test week: 23/2025`);
    setSelectedWeek(23);
    setSelectedYear(2025);
  };

  // Get assignments for the selected week using the new hook
  const userWeekAssignments = getAssignmentsForWeek(startDateISO, endDateISO);

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

      {/* Debug navigation and controls */}
      {user?.role !== 'servicemedarbejder' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 mb-2">Debug Navigation:</p>
          <div className="flex gap-2">
            <Button 
              onClick={navigateToTestWeek} 
              variant="outline" 
              size="sm"
              className="text-yellow-800 border-yellow-300"
            >
              Go to Week 23, 2025 (Test Data)
            </Button>
            <Button 
              onClick={forceRefresh} 
              variant="outline" 
              size="sm"
              className="text-yellow-800 border-yellow-300"
            >
              Force Refresh Data
            </Button>
          </div>
        </div>
      )}

      {/* DEBUG: Add debugging info for servicemedarbejder */}
      {user?.role === 'servicemedarbejder' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800 mb-2">Debug Info for {user.name}:</p>
          <div className="flex gap-2 mb-2">
            <Button 
              onClick={navigateToTestWeek} 
              variant="outline" 
              size="sm"
              className="text-blue-800 border-blue-300"
            >
              Go to Week 23, 2025
            </Button>
            <Button 
              onClick={forceRefresh} 
              variant="outline" 
              size="sm"
              className="text-blue-800 border-blue-300"
            >
              Refresh Data
            </Button>
          </div>
          <p className="text-xs text-blue-600">
            Current week: {selectedWeek}/{selectedYear} | 
            Assignments this week: {userWeekAssignments.length} |
            Check console for detailed logs
          </p>
        </div>
      )}

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
              <span className="text-sm text-gray-500">
                ({selectedYear})
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
          {assignmentsLoading ? (
            <p className="text-left py-8 text-muted-foreground">
              Loading assignments...
            </p>
          ) : userWeekAssignments.length === 0 ? (
            <div className="text-left py-8 text-muted-foreground">
              <p className="mb-2">{t('dashboard.noAssignments')}</p>
              <p className="text-sm">
                Current week: {selectedWeek}/{selectedYear} ({startDateISO} to {endDateISO})
              </p>
              <p className="text-sm mt-2">
                Try navigating to Week 23, 2025 to see test assignments.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {userWeekAssignments.map(assignment => {
                console.log(`[DashboardPage] Rendering assignment ${assignment.id} (${assignment.location}) for ${user?.name}:`, {
                  employees: assignment.employees,
                  employeeCount: assignment.employees?.length || 0,
                  allEmployeeNames: assignment.employees?.join(', ')
                });
                
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
                      
                      {/* CRITICAL: Always show ALL employees for dashboard assignments */}
                      {assignment.employees && assignment.employees.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">
                            {assignment.employees.join(', ')}
                          </span>
                          {/* DEBUG: Show employee count for servicemedarbejder */}
                          {user?.role === 'servicemedarbejder' && (
                            <span className="text-xs text-blue-500 ml-1">
                              ({assignment.employees.length} people)
                            </span>
                          )}
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
