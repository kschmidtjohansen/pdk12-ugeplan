import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/context/TranslationContext';
import { DutyEmployeeSelector } from './DutyEmployeeSelector';
import { useDutyActions } from '@/hooks/duty/useDutyActions';
import type { Duty, DutyType } from '@/types/duty';
import { format } from 'date-fns';
import { da, enUS } from 'date-fns/locale';

interface Employee {
  id: string;
  name: string;
  role?: string;
}

interface DutyEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duty: Duty | null;
  employees: Employee[];
  onSuccess: () => void;
}

export const DutyEditDialog = ({
  open,
  onOpenChange,
  duty,
  employees,
  onSuccess,
}: DutyEditDialogProps) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : enUS;
  const { updateDuty, loading } = useDutyActions(onSuccess);

  const [dutyType, setDutyType] = useState<DutyType>('skadeleder_vagt');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (duty) {
      setDutyType(duty.duty_type);
      setEmployeeId(duty.employee_id);
      setNotes(duty.notes || '');
    }
  }, [duty]);

  const validateEmployeeRole = (selectedEmployeeId: string, selectedDutyType: DutyType): boolean => {
    if (selectedDutyType === 'skadeleder_vagt') {
      const employee = employees.find(emp => emp.id === selectedEmployeeId);
      if (employee) {
        const role = employee.role;
        if (role !== 'administrator' && role !== 'skadeleder' && role !== 'super_admin') {
          setValidationError(t('duty.invalidRoleForSkadeleder'));
          return false;
        }
      }
    }
    setValidationError('');
    return true;
  };

  // Validate when duty type or employee changes
  useEffect(() => {
    if (employeeId && dutyType) {
      validateEmployeeRole(employeeId, dutyType);
    }
  }, [employeeId, dutyType, employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!duty || !employeeId) {
      return;
    }

    // Validate employee role before submitting
    if (!validateEmployeeRole(employeeId, dutyType)) {
      return;
    }

    const success = await updateDuty(duty.id, {
      employee_id: employeeId,
      notes: notes || undefined,
      duty_type: dutyType,
    });

    if (success) {
      onSuccess(); // Explicitly trigger refetch
      onOpenChange(false);
    }
  };

  if (!duty) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('duty.editDuty')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              {t('duty.selectDate')}
            </Label>
            <div className="text-base font-medium">
              {format(new Date(duty.duty_date), 'EEEE d. MMMM yyyy', { locale })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('duty.cannotChangeDateInEdit')}
            </p>
          </div>

          <div>
            <Label className="mb-2 block">{t('duty.selectEmployee')}</Label>
            <Tabs
              value={dutyType}
              onValueChange={(value) => setDutyType(value as DutyType)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="skadeleder_vagt">
                  {t('duty.skadelederVagt')}
                </TabsTrigger>
                <TabsTrigger value="kørevagt">
                  {t('duty.kørevagt')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="skadeleder_vagt" className="mt-4">
                <DutyEmployeeSelector
                  employees={employees}
                  selectedEmployeeId={employeeId}
                  onSelectEmployee={setEmployeeId}
                  dutyType="skadeleder_vagt"
                />
              </TabsContent>

              <TabsContent value="kørevagt" className="mt-4">
                <DutyEmployeeSelector
                  employees={employees}
                  selectedEmployeeId={employeeId}
                  onSelectEmployee={setEmployeeId}
                  dutyType="kørevagt"
                />
              </TabsContent>
            </Tabs>

            {validationError && (
              <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">
                  {validationError}
                </p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">
              {t('duty.notes')} <span className="text-muted-foreground">({t('duty.optional')})</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('duty.notes')}
              className="mt-2"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('duty.cancel')}
            </Button>
            <Button type="submit" disabled={loading || !employeeId || !!validationError}>
              {loading ? t('common.saving') : t('duty.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
