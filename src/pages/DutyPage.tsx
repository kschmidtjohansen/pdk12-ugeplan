import { useState, useMemo } from 'react';
import { DataFetchErrorBoundary } from '@/components/ErrorBoundary/DataFetchErrorBoundary';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions, useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useDutyData } from '@/hooks/duty/useDutyData';
import { useDutyEmployees } from '@/hooks/duty/useDutyEmployees';
import { useSharedDutyDepartments } from '@/hooks/duty/useSharedDutyDepartments';
import { useDutySwapRequests } from '@/hooks/duty/useDutySwapRequests';
import { DutyAssignmentDialog } from '@/components/Duty/DutyAssignmentDialog';
import { DutyEditDialog } from '@/components/Duty/DutyEditDialog';
import { DutySwapSelectDialog } from '@/components/Duty/DutySwapSelectDialog';
import { DutySwapDialog } from '@/components/Duty/DutySwapDialog';
import { PendingSwapOffers } from '@/components/Duty/PendingSwapOffers';
import { DutyList } from '@/components/Duty/DutyList';
import { DutyMonthCalendar } from '@/components/Duty/DutyMonthCalendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, RefreshCw, Shield } from 'lucide-react';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import type { Duty } from '@/types/duty';
import ListSkeleton from '@/components/shared/ListSkeleton';

export default function DutyPage() {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();
  const { user } = useAuth();
  const { isDutyEnabled, selectedDepartmentId, departments } = useDepartment();
  const canManage = isAdmin || isSkadeleder;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [swapSelectDialogOpen, setSwapSelectDialogOpen] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<Duty | null>(null);
  const [dutyToSwap, setDutyToSwap] = useState<Duty | null>(null);
  const [pendingNewDate, setPendingNewDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  
  // Datointerval følger den måned brugeren har åben i kalenderen, med en
  // måneds buffer i hver retning så vagter i synlige overflow-uger og
  // kommende-listen også hentes.
  const startDate = startOfMonth(subMonths(calendarMonth, 1));
  const endDate = endOfMonth(addMonths(calendarMonth, 1));

  const { duties, loading: dutiesLoading, error, refetch } = useDutyData(startDate, endDate);
  const { employees, loading: employeesLoading } = useDutyEmployees();
  const { sharedDepartmentIds } = useSharedDutyDepartments();
  const { incoming, outgoing, refetch: refetchSwap } = useDutySwapRequests();

  const loading = dutiesLoading || employeesLoading;

  // Build a department name map for shared-dept badge labels
  const departmentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    departments.forEach((d) => { map[d.id] = d.name; });
    return map;
  }, [departments]);

  // Enrich duties with employee roles + shared department label
  const dutiesWithRoles = useMemo(() => {
    return duties.map(duty => {
      const isShared = !!duty.department_id
        && duty.department_id !== selectedDepartmentId
        && sharedDepartmentIds.includes(duty.department_id);
      const sharedDepartmentName = isShared ? (departmentNameMap[duty.department_id!] || null) : null;

      if (!duty.employee_id) {
        return { ...duty, sharedDepartmentName } as Duty & { sharedDepartmentName: string | null };
      }

      const employee = employees.find(emp => emp.id === duty.employee_id);
      if (employee && duty.employee) {
        return {
          ...duty,
          employee: { ...duty.employee, role: employee.role },
          sharedDepartmentName,
        } as Duty & { sharedDepartmentName: string | null };
      }
      return { ...duty, sharedDepartmentName } as Duty & { sharedDepartmentName: string | null };
    });
  }, [duties, employees, selectedDepartmentId, sharedDepartmentIds, departmentNameMap]);

  const upcomingDuties = dutiesWithRoles.filter(
    duty => new Date(duty.duty_date) >= todayStart
  );

  const employeesWithRoles = employees.map((emp: any) => ({
    id: emp.id,
    name: emp.name,
    role: emp.role,
    avatar_url: emp.avatar_url,
    jobTitle: emp.jobTitle,
    status: emp.status,
    onLeave: emp.onLeave,
    department_id: emp.department_id ?? null,
    department_name: emp.department_id && emp.department_id !== selectedDepartmentId ? emp.department_name : null,
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

  // legacy reassign handler removed — swap now uses request flow

  if (!isDutyEnabled) {
    return (
      <div className="container mx-auto py-16 text-center">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">{t('admin.features.featureDisabled')}</p>
      </div>
    );
  }

  return (
    <DataFetchErrorBoundary>
    
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-12 py-3 sm:py-5 space-y-3 sm:space-y-4">
        <div className="mb-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">{t('duty.title')}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('duty.upcomingDuties')}</p>
            </div>
            <div className="flex gap-2 flex-wrap flex-shrink-0">
              {canManage && (
                <Button onClick={() => setDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                  {t('duty.assignDuty')}
                </Button>
              )}
              <Button
                variant="outline"
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
          <div className="mt-4 h-px bg-border" />
        </div>

      {error && (
        <Card className="border border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">
            {t('common.errorLoadingData') ?? 'Der opstod en fejl ved indlæsning af vagter.'}
          </CardContent>
        </Card>
      )}

      <PendingSwapOffers
        incoming={incoming}
        outgoing={outgoing}
        onChanged={() => { refetchSwap(); refetch(); }}
      />

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">{t('duty.calendar')}</TabsTrigger>
          <TabsTrigger value="list">{t('duty.list')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <ListSkeleton />
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
            <ListSkeleton />
          ) : (
            <DutyMonthCalendar
              duties={dutiesWithRoles}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onDutyClick={handleDutyClick}
              canManage={canManage}
              onSuccess={refetch}

              onAddDuty={canManage ? (date) => {
                setPendingNewDate(date);
                setDialogOpen(true);
              } : undefined}
            />
          )}
        </TabsContent>
      </Tabs>

      {canManage && (
        <>
          <DutyAssignmentDialog
            open={dialogOpen}
            onOpenChange={(o) => {
              setDialogOpen(o);
              if (!o) setPendingNewDate(null);
            }}
            employees={employeesWithRoles}
            duties={dutiesWithRoles}
            onSuccess={refetch}
            initialDate={pendingNewDate}
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
        onSuccess={() => {
          setSwapDialogOpen(false);
          setDutyToSwap(null);
          refetch();
        }}
      />
      </div>
    </DataFetchErrorBoundary>
  );
}
