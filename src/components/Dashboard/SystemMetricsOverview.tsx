
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Vacation } from '@/types/vacation';
import { BarChart, CalendarClock, Users, Car as CarIcon } from 'lucide-react';

interface SystemMetricsOverviewProps {
  assignments: Assignment[];
  vacations: Vacation[];
  availableEmployees: number;
  totalEmployees: number;
  availableVehicles: number;
  totalVehicles: number;
}

const SystemMetricsOverview: React.FC<SystemMetricsOverviewProps> = ({
  assignments,
  vacations,
  availableEmployees,
  totalEmployees,
  availableVehicles,
  totalVehicles
}) => {
  const { t } = useTranslation();

  // Count active assignments (assuming published ones are active)
  const activeAssignments = assignments.filter(a => a.published === true).length;
  
  // Count upcoming approved vacations
  const upcomingVacations = vacations.filter(v => 
    v.status === 'approved' && new Date(v.startDate) >= new Date()
  ).length;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="border-l-4 border-l-polygon-blue hover:bg-slate-50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.metrics.activeAssignments')}
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-polygon-light flex items-center justify-center">
            <BarChart className="h-4 w-4 text-polygon-blue" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeAssignments}</div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.metrics.activeAssignmentsDesc')}
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-polygon-purple hover:bg-slate-50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.metrics.upcomingVacations')}
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-polygon-light flex items-center justify-center">
            <CalendarClock className="h-4 w-4 text-polygon-blue" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingVacations}</div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.metrics.upcomingVacationsDesc')}
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-l-4 border-l-polygon-tertiary hover:bg-slate-50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.metrics.vehicleStatus')}
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-polygon-light flex items-center justify-center">
            <CarIcon className="h-4 w-4 text-polygon-blue" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <span className="text-polygon-blue">{availableVehicles}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span>{totalVehicles}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.metrics.vehicleStatusDesc')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMetricsOverview;
