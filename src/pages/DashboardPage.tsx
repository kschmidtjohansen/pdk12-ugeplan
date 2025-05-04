
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import PageHeader from '../components/Layout/PageHeader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock } from 'lucide-react';

// Mock data
const currentAssignments = [
  {
    id: '1',
    titleKey: 'dashboard.assignments.waterDamage',
    date: '2025-05-06',
    fromTime: '09:00',
    toTime: '11:00',
    location: 'Aarhus Central',
    car: 'Van 1',
    employee: 'John Doe',
  },
  {
    id: '2',
    titleKey: 'dashboard.assignments.fireDamage',
    date: '2025-05-07',
    fromTime: '13:00',
    toTime: '16:00',
    location: 'Copenhagen South',
    car: 'Truck 3',
    employee: 'Jane Smith',
  },
  {
    id: '3',
    titleKey: 'dashboard.assignments.mold',
    date: '2025-05-09',
    fromTime: '10:00',
    toTime: '12:30',
    location: 'Odense East',
    car: 'Van 2',
    employee: 'Mike Johnson',
  },
];

// Get current week number
const getCurrentWeek = () => {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7
  );
  return weekNum;
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const currentWeek = getCurrentWeek();

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
    const baseItems = [
      { 
        title: t('dashboard.quickAccess.planner.title'), 
        icon: <Clock className="h-10 w-10" />,
        description: t('dashboard.quickAccess.planner.description'),
        link: '/planner'
      },
      { 
        title: t('dashboard.quickAccess.vacation.title'), 
        icon: <Calendar className="h-10 w-10" />,
        description: t('dashboard.quickAccess.vacation.description'),
        link: '/vacation'
      },
    ];
    
    // Add role-specific items
    if (user?.role === 'administrator' || user?.role === 'skadeleder') {
      baseItems.push(
        { 
          title: t('dashboard.quickAccess.employees.title'), 
          icon: <Users className="h-10 w-10" />,
          description: t('dashboard.quickAccess.employees.description'),
          link: '/employees'
        },
        { 
          title: t('dashboard.quickAccess.cars.title'), 
          icon: <Car className="h-10 w-10" />,
          description: t('dashboard.quickAccess.cars.description'),
          link: '/cars'
        }
      );
    }
    
    return baseItems;
  };

  return (
    <>
      <PageHeader 
        title={t('dashboard.welcome', { name: user?.name })}
        description={t('dashboard.today', { 
          date: getFormattedDate(), 
          week: currentWeek 
        })}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getQuickAccessItems().map((item, index) => (
          <Link key={index} to={item.link} className="block">
            <Card className="h-full hover:border-polygon-red transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="text-polygon-red">{item.icon}</div>
                <CardTitle className="mt-2">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{t('dashboard.weekAssignments', { week: currentWeek })}</span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/planner">{t('dashboard.viewAll')}</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentAssignments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {t('dashboard.noAssignments')}
            </p>
          ) : (
            <div className="grid gap-4">
              {currentAssignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="border rounded-md p-4 bg-white hover:border-polygon-red transition-colors"
                >
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                    <h3 className="font-medium">{t(assignment.titleKey)}</h3>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded-md">
                      {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{t('dashboard.assignmentTime', { fromTime: assignment.fromTime, toTime: assignment.toTime })}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{assignment.employee}</span>
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
        <CardFooter className="flex justify-center border-t pt-4">
          <Button asChild className="bg-polygon-red hover:bg-polygon-darkred">
            <Link to="/planner">
              <Clock className="mr-2 h-4 w-4" />
              {t('dashboard.manageAssignments')}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default DashboardPage;
