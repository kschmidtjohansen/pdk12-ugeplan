import { useState, useMemo } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions, useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useDutyData } from '@/hooks/duty/useDutyData';
import { useEmployeeData } from '@/hooks/employee/useEmployeeData';
import { useDutyActions } from '@/hooks/duty/useDutyActions';
import { DutyAssignmentDialog } from '@/components/Duty/DutyAssignmentDialog';
import { DutyEditDialog } from '@/components/Duty/DutyEditDialog';
import { DutySwapSelectDialog } from '@/components/Duty/DutySwapSelectDialog';
import { DutySwapDialog } from '@/components/Duty/DutySwapDialog';
import { DutyList } from '@/components/Duty/DutyList';
import { DutyMonthCalendar } from '@/components/Duty/DutyMonthCalendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, RefreshCw, Shield } from 'lucide-react';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import type { Duty } from '@/types/duty';

export default function DutyPage() {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();
  const { user } = useAuth();
  const { isDutyEnabled } = useDepartment();
  const canManage = isAdmin || isSkadeleder;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [swapSelectDialogOpen, setSwapSelectDialogOpen] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<Duty | null>(null);
  const [dutyToSwap, setDutyToSwap] = useState<Duty | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  
  const startDate = startOfMonth(selectedMonth);
  const endDate = endOfMonth(addMonths(selectedMonth, 2));

  const { duties, loading: dutiesLoading, error, refetch } = useDutyData(startDate, endDate);
  const { employees, loading: employeesLoading } = useEmployeeData();
  const { reassignDuty } = useDutyActions(refetch);

  const loading = dutiesLoading || employeesLoading;

  // Enrich duties with employee roles from the employees data
  const dutiesWithRoles = useMemo(() => {
    return duties.map(duty => {
      if (!duty.employee_id) return duty; // External duties have no employee
      
      const employee = employees.find(emp => emp.id === duty.employee_id);
      if (employee && duty.employee) {
        return {
          ...duty,
          employee: {
            ...duty.employee,
            role: employee.role
          }
        };
      }
      return duty;
    });
  }, [duties, employees]);

  const upcomingDuties = dutiesWithRoles.filter(
    duty => new Date(duty.duty_date) >= todayStart
  );

  const employeesWithRoles = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    role: emp.role,
    avatar_url: emp.avatar_url,
    jobTitle: emp.jobTitle,
    status: emp.status,
    onLeave: emp.onLeave,
  }));

  const handleDutyClick = (duty: Duty) => {
    setSelectedDuty(duty);
    setEditDialogOpen(true);
  };

  const handleDutySelectedForSwap = (duty: Duty) => {
    setDutyToSwap(duty);
    setSwapSelectDialogOpen(false);
    setSwapDialogOpen(true);
  };

  const handleReassignment = async (dutyId: string, newEmployeeId: string) => {
    const success = await reassignDuty(dutyId, newEmployeeId);
    if (success) {
      setSwapDialogOpen(false);
      setDutyToSwap(null);
      refetch();
    }
    return success;
  };

  if (!isDutyEnabled) {
    return (
      <div className="container mx-auto py-16 text-center">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">{t('admin.features.featureDisabled')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">{t('duty.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1 sm:mt-2">
            {t('duty.upcomingDuties')}
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          {canManage && (
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              {t('duty.assignDuty')}
            </Button>
          )}
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => setSwapSelectDialogOpen(true)}
            disabled={
              dutiesWithRoles.length === 0 || 
              (user?.role === 'servicemedarbejder'
                ? !dutiesWithRoles.some(d => d.duty_type === 'kørevagt' && d.employee_id === user.id)
                : !dutiesWithRoles.some(d => d.employee_id === user.id))
            }
          >
            <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
            {t('duty.swapDuty')}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">
            {t('common.errorLoadingData') ?? 'Der opstod en fejl ved indlæsning af vagter.'}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">{t('duty.calendar')}</TabsTrigger>
          <TabsTrigger value="list">{t('duty.list')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : dutiesWithRoles.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">{t('duty.noDutiesInPlan')}</p>
              </CardContent>
            </Card>
          ) : upcomingDuties.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">{t('duty.noUpcomingDuties')}</p>
              </CardContent>
            </Card>
          ) : (
            <DutyList
              duties={upcomingDuties}
              onSuccess={refetch}
              canManage={canManage}
              onDutyClick={handleDutyClick}
            />
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : (
            <DutyMonthCalendar
              duties={dutiesWithRoles}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onDutyClick={handleDutyClick}
              canManage={canManage}
            />
          )}
        </TabsContent>
      </Tabs>

      {canManage && (
        <>
          <DutyAssignmentDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            employees={employeesWithRoles}
            duties={dutiesWithRoles}
            onSuccess={refetch}
          />
          <DutyEditDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            duty={selectedDuty}
            employees={employeesWithRoles}
            onSuccess={refetch}
          />
        </>
      )}
      
      <DutySwapSelectDialog
        open={swapSelectDialogOpen}
        onOpenChange={setSwapSelectDialogOpen}
        duties={dutiesWithRoles}
        currentUserId={user?.id}
        onDutySelected={handleDutySelectedForSwap}
      />
      <DutySwapDialog
        duty={dutyToSwap}
        employees={employeesWithRoles}
        open={swapDialogOpen}
        onOpenChange={setSwapDialogOpen}
        onReassign={handleReassignment}
      />
    </div>
  );
}
