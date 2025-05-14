
import React, { useState } from 'react';
import { useVacations } from '@/hooks/useVacations';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { usePermissions } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { format } from 'date-fns';
import { 
  UserCheck, CarFront, CheckSquare, UserX
} from 'lucide-react';

import UpcomingVacationsWidget from './UpcomingVacationsWidget';
import EmployeeAvailabilityDialog from './EmployeeAvailabilityDialog';

const DashboardMetrics: React.FC = () => {
  const { vacations } = useVacations();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { assignments } = usePlannerAssignments();
  const { isAdmin, isSkadeleder } = usePermissions();
  const { t } = useTranslation();

  // Add state for dialogs
  const [availableEmployeesDialogOpen, setAvailableEmployeesDialogOpen] = useState(false);
  const [unavailableEmployeesDialogOpen, setUnavailableEmployeesDialogOpen] = useState(false);

  // Show metrics only for admin and skadeleder roles
  const shouldShowMetrics = isAdmin || isSkadeleder;

  // Filter out admin and skadeleder users from employee counts
  const filteredEmployees = employees.filter(e => 
    e.role !== 'administrator' && e.role !== 'skadeleder'
  );
  
  // Calculate metrics - only counting regular employees
  const availableEmployees = filteredEmployees.filter(e => !e.onLeave);
  const onLeaveEmployees = filteredEmployees.filter(e => e.onLeave);
  const availableEmployeesCount = availableEmployees.length;
  const onLeaveEmployeesCount = onLeaveEmployees.length;
  const totalFilteredEmployees = filteredEmployees.length;
  
  const availableCars = cars.length;
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAssignments = assignments.filter(a => a.date === today).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {shouldShowMetrics && (
        <>
          <Card 
            className="cursor-pointer hover:border-polygon-blue transition-colors"
            onClick={() => setAvailableEmployeesDialogOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.availableEmployees')}
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableEmployeesCount}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.totalEmployees', { count: totalFilteredEmployees })}
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:border-polygon-blue transition-colors"
            onClick={() => setUnavailableEmployeesDialogOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t('dashboard.onLeaveEmployees')}
              </CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{onLeaveEmployeesCount}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.totalEmployees', { count: totalFilteredEmployees })}
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
              <div className="text-2xl font-bold">{availableCars}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.totalCars', { count: availableCars })}
              </p>
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
        </>
      )}

      {/* Full width upcoming vacations for all users */}
      <div className={shouldShowMetrics ? "md:col-span-2 lg:col-span-4" : "md:col-span-2 lg:col-span-4"}>
        <UpcomingVacationsWidget vacations={vacations} />
      </div>

      {/* Employee availability dialogs */}
      <EmployeeAvailabilityDialog 
        open={availableEmployeesDialogOpen}
        onOpenChange={setAvailableEmployeesDialogOpen}
        employees={availableEmployees}
        title={t('dashboard.availableEmployees')}
        description={t('dashboard.availableEmployeesDesc')}
        isAvailable={true}
      />

      <EmployeeAvailabilityDialog 
        open={unavailableEmployeesDialogOpen}
        onOpenChange={setUnavailableEmployeesDialogOpen}
        employees={onLeaveEmployees}
        title={t('dashboard.onLeaveEmployees')}
        description={t('dashboard.unavailableEmployeesDesc')}
        isAvailable={false}
      />
    </div>
  );
};

export default DashboardMetrics;
