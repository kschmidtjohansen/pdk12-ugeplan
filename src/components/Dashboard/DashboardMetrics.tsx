import React, { useState, useEffect } from 'react';
import { useVacations } from '@/hooks/useVacations';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { usePermissions } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { format, addDays, isToday } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  UserCheck, CarFront, CheckSquare, UserX, ChevronRight
} from 'lucide-react';

import UpcomingVacationsWidget from './UpcomingVacationsWidget';
import EmployeeAvailabilityDialog from './EmployeeAvailabilityDialog';

const DashboardMetrics: React.FC = () => {
  const { vacations } = useVacations();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { assignments } = usePlannerAssignments();
  const { isAdmin, isSkadeleder, isSuperadmin } = usePermissions();
  const { t, currentLanguage } = useTranslation();

  // Add state for dialogs
  const [availableEmployeesDialogOpen, setAvailableEmployeesDialogOpen] = useState(false);
  const [unavailableEmployeesDialogOpen, setUnavailableEmployeesDialogOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  // Add a state for unavailable employees view date
  const [unavailableViewDate, setUnavailableViewDate] = useState(new Date());

  // Show metrics for admin, skadeleder, and superadmin roles
  const shouldShowMetrics = isAdmin || isSkadeleder || isSuperadmin;

  // Filter out admin and skadeleder users from employee counts
  const filteredEmployees = employees.filter(e => 
    e.role !== 'administrator' && e.role !== 'skadeleder'
  );
  
  // Format today's date for comparison
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayAssignments = assignments.filter(a => a.date === today).length;
  
  // Helper function to check if an employee is available on a specific date
  const isEmployeeAvailableOnDate = (employeeId: string, checkDate: string): boolean => {
    // Check if employee is on leave
    const employee = employees.find(e => e.id === employeeId);
    if (!employee || employee.onLeave) return false;
    
    // Check if employee is on vacation
    const isOnVacation = vacations.some(v => 
      v.employeeId === employeeId && 
      v.status === 'approved' && 
      format(v.startDate, 'yyyy-MM-dd') <= checkDate && 
      format(v.endDate, 'yyyy-MM-dd') > checkDate
    );
    
    if (isOnVacation) return false;
    
    return true;
  };

  // Helper function to check if an employee is unavailable on a specific date
  const isEmployeeUnavailableOnDate = (employeeId: string, checkDate: string): boolean => {
    // Check if employee is on leave
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return false;
    
    // Employee is unavailable if they are on leave
    if (employee.onLeave) return true;
    
    // Check if employee is on vacation
    const isOnVacation = vacations.some(v => 
      v.employeeId === employeeId && 
      v.status === 'approved' && 
      format(v.startDate, 'yyyy-MM-dd') <= checkDate && 
      format(v.endDate, 'yyyy-MM-dd') > checkDate
    );
    
    return isOnVacation;
  };

  // Get all assignments for today
  const todayAssignmentsList = assignments.filter(a => a.date === today);
  
  // Get employees who are assigned to tasks today
  const assignedEmployeesIds = todayAssignmentsList.flatMap(a => 
    a.employees.map(name => {
      const employee = employees.find(e => e.name === name);
      return employee ? employee.id : '';
    }).filter(id => id !== '')
  );
  
  // Calculate metrics - only counting regular employees
  // An employee is available if they are not on leave, not on vacation, and not assigned to a task today
  const availableEmployees = filteredEmployees.filter(e => 
    isEmployeeAvailableOnDate(e.id, today) && 
    !assignedEmployeesIds.includes(e.id)
  );
  
  // Get unavailable employees for the currently viewed date (for the dialog)
  const getUnavailableEmployeesForDate = (checkDate: string) => {
    return filteredEmployees.filter(e => isEmployeeUnavailableOnDate(e.id, checkDate));
  };
  
  // Get unavailable employees for today (for the dashboard card)
  const onLeaveEmployees = getUnavailableEmployeesForDate(today);
  
  const availableEmployeesCount = availableEmployees.length;
  const onLeaveEmployeesCount = onLeaveEmployees.length;
  const totalFilteredEmployees = filteredEmployees.length;
  
  // Filter cars to only include those marked as available
  const availableCarsCount = cars.filter(car => car.is_available).length;
  const totalCarsCount = cars.length;

  // Format today's date with proper locale
  const getFormattedToday = () => {
    try {
      // Use Danish locale if the current language is Danish
      const locale = currentLanguage === 'da' ? da : undefined;
      const dateStr = format(new Date(), 'PPP', { locale });
      
      // Capitalize first letter for Danish dates
      if (currentLanguage === 'da') {
        return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
      }
      return dateStr;
    } catch (e) {
      console.error("Error formatting today's date:", e);
      return format(new Date(), 'PPP');
    }
  };
  
  // Use the translations directly from the translation context
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {shouldShowMetrics && (
        <>
          <Card 
            className="cursor-pointer hover:border-polygon-blue transition-colors"
            onClick={() => {
              setViewDate(new Date());
              setAvailableEmployeesDialogOpen(true);
            }}
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
              <p className="text-xs text-muted-foreground mt-1">
                {t('dashboard.todaysDate', { date: getFormattedToday() })}
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:border-polygon-blue transition-colors"
            onClick={() => {
              setUnavailableViewDate(new Date());
              setUnavailableEmployeesDialogOpen(true);
            }}
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
              <p className="text-xs text-muted-foreground mt-1">
                {t('dashboard.todaysDate', { date: getFormattedToday() })}
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
              <div className="text-2xl font-bold">{availableCarsCount}</div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.totalCars', { count: totalCarsCount })}
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

      {/* Full width upcoming vacations for ALL users (not just admin/skadeleder) */}
      <div className={shouldShowMetrics ? "md:col-span-2 lg:col-span-4" : "md:col-span-2 lg:col-span-4"}>
        <UpcomingVacationsWidget vacations={vacations} />
      </div>

      {/* Employee availability dialogs */}
      {shouldShowMetrics && (
        <>
          <EmployeeAvailabilityDialog 
            open={availableEmployeesDialogOpen}
            onOpenChange={setAvailableEmployeesDialogOpen}
            employees={availableEmployees}
            title={t('dashboard.availableEmployees')}
            description={t('dashboard.availableEmployeesDesc')}
            isAvailable={true}
            viewDate={viewDate}
            onViewDateChange={setViewDate}
            assignments={assignments}
            allEmployees={filteredEmployees}
            vacations={vacations}
          />

          <EmployeeAvailabilityDialog 
            open={unavailableEmployeesDialogOpen}
            onOpenChange={setUnavailableEmployeesDialogOpen}
            employees={onLeaveEmployees}
            title={t('dashboard.onLeaveEmployees')}
            description={t('dashboard.unavailableEmployeesDesc')}
            isAvailable={false}
            viewDate={unavailableViewDate}
            onViewDateChange={setUnavailableViewDate}
            assignments={assignments}
            allEmployees={filteredEmployees}
            vacations={vacations}
          />
        </>
      )}
    </div>
  );
};

export default DashboardMetrics;
