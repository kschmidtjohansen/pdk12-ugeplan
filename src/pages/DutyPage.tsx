import { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions, useAuth } from '@/context/AuthContext';
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
import { Plus, RefreshCw } from 'lucide-react';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';
import type { Duty } from '@/types/duty';

export default function DutyPage() {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();
  const { user } = useAuth();
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
  const { swapDuties } = useDutyActions();

  const loading = dutiesLoading || employeesLoading;

  const upcomingDuties = duties.filter(
    duty => new Date(duty.duty_date) >= todayStart
  );

  const employeesWithRoles = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    role: emp.role,
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

  const handleSwapComplete = async (duty1Id: string, duty2Id: string) => {
    const success = await swapDuties(duty1Id, duty2Id);
    if (success) {
      setSwapDialogOpen(false);
      setDutyToSwap(null);
      refetch();
    }
    return success;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('duty.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('duty.upcomingDuties')}
            </p>
          </div>
          
          {canManage && (
            <div className="flex gap-2">
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('duty.assignDuty')}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setSwapSelectDialogOpen(true)}
                disabled={
                  duties.length < 2 || 
                  (user?.role === 'servicemedarbejder'
                    ? !duties.some(d => d.duty_type === 'kørevagt' && d.employee_id === user.id)
                    : !duties.some(d => d.employee_id === user.id))
                }
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('duty.swapDuty')}
              </Button>
            </div>
          )}
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
            ) : duties.length === 0 ? (
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
                duties={duties}
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
              duties={duties}
              onSuccess={refetch}
            />
            <DutyEditDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              duty={selectedDuty}
              employees={employeesWithRoles}
              onSuccess={refetch}
            />
            <DutySwapSelectDialog
              open={swapSelectDialogOpen}
              onOpenChange={setSwapSelectDialogOpen}
              duties={duties}
              currentUserId={user?.id}
              onDutySelected={handleDutySelectedForSwap}
            />
            <DutySwapDialog
              duty={dutyToSwap}
              allDuties={duties}
              currentUserId={user?.id}
              open={swapDialogOpen}
              onOpenChange={setSwapDialogOpen}
              onSwap={handleSwapComplete}
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}
