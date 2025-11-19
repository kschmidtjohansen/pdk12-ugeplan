import { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { useDutyData } from '@/hooks/duty/useDutyData';
import { useEmployeeData } from '@/hooks/employee/useEmployeeData';
import { DutyAssignmentDialog } from '@/components/Duty/DutyAssignmentDialog';
import { DutyList } from '@/components/Duty/DutyList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

export default function DutyPage() {
  const { t } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();
  const canManage = isAdmin || isSkadeleder;

  const [dialogOpen, setDialogOpen] = useState(false);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('duty.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('duty.upcomingDuties')}
            </p>
          </div>
          
          {canManage && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('duty.assignEmployee')}
            </Button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <DutyList
            duties={upcomingDuties}
            onSuccess={refetch}
            canManage={canManage}
          />
        )}

        {canManage && (
          <DutyAssignmentDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            employees={employeesWithRoles}
            duties={duties}
            onSuccess={refetch}
          />
        )}
      </div>
    </MainLayout>
  );
}
