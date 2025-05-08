
import React from 'react';
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

// Import assignments from planner hook to reuse the mock data
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';

const DashboardPage: React.FC = () => {
  const {
    user
  } = useAuth();
  const {
    t,
    currentLanguage
  } = useTranslation();
  const currentWeek = getCurrentWeek();

  // Use the same assignments data from the planner hook
  const {
    assignments
  } = usePlannerAssignments();

  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  // Get only the assignments for the current user and today's date
  // For published assignments only (service employees can only see published tasks)
  const todaysAssignments = assignments.filter(assignment => {
    return assignment.date === today && assignment.published === true && user && assignment.employees.includes(user.name);
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

  return (
    <>
      <PageHeader title={t('dashboard.welcome', {
        name: user?.name
      })} description={t('dashboard.today', {
        date: getFormattedDate(),
        week: currentWeek
      })} />

      {/* Quick access grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getQuickAccessItems().map((item, index) => (
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

      {/* Dashboard metrics for admin/skadeleder */}
      {shouldShowMetrics && <DashboardMetrics />}

      {/* Today's assignments */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>
              {t('dashboard.myAssignments', {
                week: currentWeek
              })}
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/planner">{t('dashboard.viewAll')}</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaysAssignments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {t('dashboard.noAssignments')}
            </p>
          ) : (
            <div className="grid gap-4">
              {todaysAssignments.map(assignment => (
                <div key={assignment.id} className="border rounded-md p-4 bg-white hover:border-polygon-blue transition-colors">
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <h3 className="font-medium">{assignment.title}</h3>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded-md">
                      {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                  <div className="text-sm text-gray-500 flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{t('dashboard.assignmentTime', {
                        fromTime: assignment.fromTime,
                        toTime: assignment.toTime
                      })}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{assignment.location}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Car className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{assignment.car}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default DashboardPage;
