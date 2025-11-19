import { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { useDutyData } from '@/hooks/duty/useDutyData';
import { useEmployeeData } from '@/hooks/employee/useEmployeeData';
import { DutyAssignmentForm } from '@/components/Duty/DutyAssignmentForm';
import { DutyList } from '@/components/Duty/DutyList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, List } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

export default function DutyPage() {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();
  const canManage = isAdmin || isSkadeleder;

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const startDate = startOfMonth(selectedMonth);
  const endDate = endOfMonth(addMonths(selectedMonth, 2));

  const { duties, loading: dutiesLoading, refetch } = useDutyData(startDate, endDate);
  const { employees, loading: employeesLoading } = useEmployeeData();

  const loading = dutiesLoading || employeesLoading;

  const upcomingDuties = duties.filter(
    duty => new Date(duty.duty_date) >= new Date()
  );

  const employeesWithRoles = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    role: emp.role,
  }));

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('duty.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {canManage 
              ? t('duty.assignEmployee') 
              : t('duty.currentWeekDuty')
            }
          </p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <Tabs defaultValue={canManage ? 'assign' : 'list'} className="space-y-6">
            <TabsList>
              {canManage && (
                <TabsTrigger value="assign" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('duty.calendar')}
                </TabsTrigger>
              )}
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                {t('duty.list')}
              </TabsTrigger>
            </TabsList>

            {canManage && (
              <TabsContent value="assign" className="space-y-6">
                <DutyAssignmentForm
                  employees={employeesWithRoles}
                  duties={duties}
                  onSuccess={refetch}
                />
              </TabsContent>
            )}

            <TabsContent value="list" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  {t('duty.upcomingDuties')}
                </h2>
                <DutyList
                  duties={upcomingDuties}
                  onSuccess={refetch}
                  canManage={canManage}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
