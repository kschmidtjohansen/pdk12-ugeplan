
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Vacation } from '@/types/vacation';
import { BarChart, CalendarClock, Users, Car as CarIcon } from 'lucide-react';

interface SystemMetricsOverviewProps {
  assignments: Assignment[];
  upcomingVacations: number;
  availableVehicles: number;
  totalVehicles: number;
}

const SystemMetricsOverview: React.FC<SystemMetricsOverviewProps> = ({
  assignments,
  upcomingVacations,
  availableVehicles,
  totalVehicles
}) => {
  const { t } = useTranslation();
  
  // Count active assignments (assuming published ones are active)
  const activeAssignments = assignments.filter(a => a.published === true).length;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.metrics.activeAssignments')}
          </CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeAssignments}</div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.metrics.activeAssignmentsDesc')}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.metrics.upcomingVacations')}
          </CardTitle>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingVacations}</div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.metrics.upcomingVacationsDesc')}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.metrics.vehicleStatus')}
          </CardTitle>
          <CarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{availableVehicles} / {totalVehicles}</div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.metrics.vehicleStatusDesc')}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.metrics.employeeActivity')}
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">85%</div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.metrics.employeeActivityDesc')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMetricsOverview;
