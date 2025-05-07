import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import PageHeader from '../components/Layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { getCurrentWeek } from '@/types/assignment';
import Dashboard from '@/components/Dashboard/Dashboard';

// Import assignments from planner hook to reuse the mock data
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const currentWeek = getCurrentWeek();
  
  // Use the same assignments data from the planner hook
  const { assignments } = usePlannerAssignments();

  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  // Get only the assignments for the current user and today's date
  // For published assignments only (service employees can only see published tasks)
  const todaysAssignments = assignments.filter(assignment => {
    return assignment.date === today && 
           assignment.published === true &&
           user && assignment.employees.includes(user.name);
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
  
  return (
    <>
      <PageHeader 
        title={t('dashboard.welcome', { name: user?.name })} 
        description={t('dashboard.today', {
          date: getFormattedDate(),
          week: currentWeek
        })} 
      />

      {/* Dashboard Component */}
      <Dashboard />

      {/* My Assignments Section - Kept from original implementation */}
      <Card className="my-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>
              {t('dashboard.myAssignments', { week: currentWeek })}
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
