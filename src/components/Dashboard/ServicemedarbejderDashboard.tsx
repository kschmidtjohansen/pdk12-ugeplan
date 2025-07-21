
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getCurrentWeek, getCurrentWeekDates, getCurrentWeekNumber, getPreviousWeekInfo, getNextWeekInfo } from '@/utils/weekDates';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useVacations } from '@/hooks/useVacations';
import WeekNavigation from './WeekNavigation';
import AssignmentDetails from '@/components/Planner/AssignmentDetails';
import UpcomingVacationsWidget from './UpcomingVacationsWidget';
import { Link } from 'react-router-dom';

const ServicemedarbejderDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { assignments } = usePlannerAssignments();
  const { vacations } = useVacations();

  // State for week navigation
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekNumber());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  // Get user's assignments for the selected week (only published assignments assigned to them)
  const userWeekAssignments = assignments.filter(assignment => {
    const assignmentDate = assignment.date;
    const isInCurrentWeek = assignmentDate >= startDateISO && assignmentDate <= endDateISO;
    return isInCurrentWeek && 
           assignment.published === true && 
           assignment.employees && 
           assignment.employees.some(employeeName => employeeName === user?.name);
  }).sort((a, b) => {
    if (a.date !== b.date) {
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

  // Quick access items for servicemedarbejder
  const quickAccessItems = [
    {
      title: t('dashboard.quickAccess.planner.title'),
      icon: <Clock className="h-10 w-10" />,
      description: t('dashboard.quickAccess.planner.description'),
      link: '/planner'
    },
    {
      title: t('dashboard.quickAccess.vacation.title'),
      icon: <Calendar className="h-10 w-10 text-polygon-blue" />,
      description: t('dashboard.quickAccess.vacation.description'),
      link: '/vacation'
    }
  ];

  return (
    <>
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('dashboard.welcome', { name: user?.name })}
        </h1>
        <p className="text-gray-600">
          {t('dashboard.today', { date: getFormattedDate(), week: getCurrentWeek() })}
        </p>
      </div>

      {/* Quick access grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {quickAccessItems.map((item, index) => (
          <Link key={index} to={item.link} className="block">
            <Card className="h-full hover:border-polygon-blue transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="text-polygon-blue">{item.icon}</div>
                <CardTitle className="mt-2">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* My assignments */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>
                {t('dashboard.myAssignments', { week: selectedWeek })}
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
            <p className="text-center py-8 text-muted-foreground">
              {t('dashboard.noAssignments')}
            </p>
          ) : (
            <div className="grid gap-4">
              {userWeekAssignments.map(assignment => (
                <div key={assignment.id} className="border rounded-md p-4 bg-white hover:border-polygon-blue transition-colors">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-lg">{assignment.location}</h3>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded-md">
                      {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 font-medium">{assignment.title}</p>
                  <AssignmentDetails assignment={assignment} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming vacations */}
      <UpcomingVacationsWidget vacations={vacations} />
    </>
  );
};

export default ServicemedarbejderDashboard;
