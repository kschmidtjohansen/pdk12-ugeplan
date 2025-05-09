
import React from 'react';
import { useVacations } from '@/hooks/useVacations';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/useCars';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { usePermissions } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { format } from 'date-fns';
import { 
  UserCheck, CarFront, CheckSquare, UserX
} from 'lucide-react';

import UpcomingVacationsWidget from './UpcomingVacationsWidget';
import UpcomingAssignmentsWidget from './UpcomingAssignmentsWidget';

const DashboardMetrics: React.FC = () => {
  const { vacations } = useVacations();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { assignments } = usePlannerAssignments();
  const { isAdmin, isSkadeleder } = usePermissions();
  const { t } = useTranslation();

  // Calculate metrics
  const availableEmployees = employees.filter(e => !e.onLeave).length;
  const onLeaveEmployees = employees.filter(e => e.onLeave).length;
  const totalCars = cars.length;
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAssignments = assignments.filter(a => a.date === today).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.availableEmployees')}
          </CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{availableEmployees}</div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.totalEmployees', { count: employees.length })}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.onLeaveEmployees')}
          </CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{onLeaveEmployees}</div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.totalEmployees', { count: employees.length })}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.availableCars')}
          </CardTitle>
          <CarFront className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCars}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.todayAssignments')}
          </CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayAssignments}</div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.scheduledToday')}
          </p>
        </CardContent>
      </Card>

      {/* Only show upcoming vacations for admin and skadeleder */}
      {(isAdmin || isSkadeleder) && (
        <UpcomingVacationsWidget vacations={vacations} />
      )}
      
      <UpcomingAssignmentsWidget />
    </div>
  );
};

export default DashboardMetrics;
