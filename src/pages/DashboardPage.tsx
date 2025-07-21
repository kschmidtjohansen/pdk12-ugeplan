
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
import AssignmentDetails from '@/components/Planner/AssignmentDetails';
import { useDashboardEmployeeStatus } from '@/hooks/useDashboardEmployeeStatus';

const DashboardPage: React.FC = () => {
  const {
    user
  } = useAuth();
  const {
    t,
    currentLanguage
  } = useTranslation();
  const {
    assignments
  } = usePlannerAssignments();
  const {
    employees
  } = useEmployees();
  const {
    cars
  } = useCars();
  const {
    vacations
  } = useVacations();
  const { filterByWeek } = useAssignmentFilters();

  // State for week navigation
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekNumber());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Update employee leave status based on vacations when dashboard loads
  useDashboardEmployeeStatus();

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

  // Get assignments for the selected week and user
  const userWeekAssignments = assignments.filter(assignment => {
    // Check if assignment is within the selected week
    const assignmentDate = assignment.date;
    const isInCurrentWeek = assignmentDate >= startDateISO && assignmentDate <= endDateISO;

    // For administrators and skadeledere, show all assignments for the week
    if (user?.role === 'administrator' || user?.role === 'skadeleder') {
      return isInCurrentWeek;
    } else {
      // For regular users, show only published assignments assigned to them
      return isInCurrentWeek && assignment.published === true && assignment.employees && assignment.employees.some(employeeName => employeeName === user?.name);
    }
  }).sort((a, b) => {
    // Sort by date first (earliest first)
    if (a.date !== b.date) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    // If same date, sort by fromTime (earliest first)
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
  
  return <>
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
                <p className="text-muted-foreground text-sm">{item.description}</p>
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
          {userWeekAssignments.length === 0 ? <p className="text-center py-8 text-muted-foreground">
              {t('dashboard.noAssignments')}
            </p> : <div className="grid gap-4">
              {userWeekAssignments.map(assignment => <div key={assignment.id} className="border rounded-md p-4 bg-white hover:border-polygon-blue transition-colors">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-lg">{assignment.location}</h3>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded-md">
                      {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 font-medium">{assignment.title}</p>
                  <AssignmentDetails assignment={assignment} />
                </div>)}
            </div>}
        </CardContent>
      </Card>
    </>;
};

export default DashboardPage;
