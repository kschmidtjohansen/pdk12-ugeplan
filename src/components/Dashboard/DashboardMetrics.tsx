
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { format } from 'date-fns';
import EmployeeAvailabilityDialog from './EmployeeAvailabilityDialog';

const DashboardMetrics: React.FC = () => {
  const { isAdmin, isSkadeleder } = usePermissions();
  const { t } = useTranslation();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();
  const { assignments } = usePlannerAssignments();
  
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [unavailableDialogOpen, setUnavailableDialogOpen] = useState(false);

  // Only show for admin or skadeleder
  if (!isAdmin && !isSkadeleder) {
    return null;
  }

  const today = format(new Date(), 'yyyy-MM-dd');

  // Helper function to check if an employee is on vacation today
  const isEmployeeOnVacationToday = (employeeId: string) => {
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    
    return vacations.some(vacation => {
      if (vacation.employeeId !== employeeId || vacation.status !== 'approved') {
        return false;
      }
      
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return todayDate >= startDate && todayDate <= endDate;
    });
  };

  // Calculate available employees (not on leave and not on vacation)
  const availableEmployees = employees.filter(employee => 
    !employee.onLeave && !isEmployeeOnVacationToday(employee.id)
  );

  // FIXED: Calculate unavailable employees (only those on leave or on vacation)
  const unavailableEmployees = employees.filter(employee => 
    employee.onLeave || isEmployeeOnVacationToday(employee.id)
  );

  // Calculate cars in use today
  const carsInUseToday = assignments
    .filter(a => a.date === today && a.car)
    .reduce((uniqueCars, assignment) => {
      const carId = typeof assignment.car === 'string' ? assignment.car : assignment.car?.id;
      if (carId && !uniqueCars.includes(carId)) {
        uniqueCars.push(carId);
      }
      return uniqueCars;
    }, [] as string[]).length;

  const availableCars = cars.filter(car => car.is_available).length;

  const metrics = [
    {
      title: t('dashboard.metrics.availableEmployees'),
      value: availableEmployees.length,
      subtitle: `${employees.length} ${t('admin.quickStats.total')}`,
      icon: <Users className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => setAvailabilityDialogOpen(true)
    },
    {
      title: t('dashboard.metrics.unavailableEmployees'),
      value: unavailableEmployees.length,
      subtitle: t('dashboard.metrics.unavailableSubtitle'),
      icon: <Users className="h-6 w-6" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      onClick: () => setUnavailableDialogOpen(true)
    },
    {
      title: t('dashboard.metrics.availableCars'),
      value: availableCars,
      subtitle: `${cars.length} ${t('admin.quickStats.total')}`,
      icon: <Car className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('dashboard.metrics.carsInUse'),
      value: carsInUseToday,
      subtitle: t('dashboard.metrics.carsInUseSubtitle'),
      icon: <Car className="h-6 w-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <Card 
            key={index}
            className={`${metric.onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200 hover:border-polygon-blue' : ''}`}
            onClick={metric.onClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.subtitle}</p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor} ${metric.color}`}>
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Employee Availability Dialog */}
      <EmployeeAvailabilityDialog
        open={availabilityDialogOpen}
        onOpenChange={setAvailabilityDialogOpen}
        employees={availableEmployees}
        assignments={assignments}
        vacations={vacations}
        selectedDate={today}
        title={t('dashboard.metrics.availableEmployees')}
      />

      {/* Unavailable Employees Dialog */}
      <EmployeeAvailabilityDialog
        open={unavailableDialogOpen}
        onOpenChange={setUnavailableDialogOpen}
        employees={unavailableEmployees}
        assignments={assignments}
        vacations={vacations}
        selectedDate={today}
        title={t('dashboard.metrics.unavailableEmployees')}
      />
    </>
  );
};

export default DashboardMetrics;
