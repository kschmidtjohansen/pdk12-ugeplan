import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Shield, Car, Loader2 } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyFormState } from '@/hooks/duty/useDutyFormState';
import { useDutyActions } from '@/hooks/duty/useDutyActions';
import { DutyEmployeeSelector } from './DutyEmployeeSelector';
import { DutyCalendar } from './DutyCalendar';
import { toast } from '@/hooks/use-toast';
import type { Duty } from '@/types/duty';

interface Employee {
  id: string;
  name: string;
  role?: string;
}

interface DutyAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  duties: Duty[];
  onSuccess: () => void;
  initialDate?: Date | null;
  initialDutyType?: 'skadeleder_vagt' | 'kørevagt';
}

export const DutyAssignmentDialog = ({
  open,
  onOpenChange,
  employees,
  duties,
  onSuccess,
  initialDate,
  initialDutyType,
}: DutyAssignmentDialogProps) => {
  const { t } = useTranslation();
  const { formData, manualName, setDutyType, setEmployeeId, setDates, setNotes, setManualName, resetForm } = useDutyFormState({
    initialDate,
    initialDutyType,
    resetSignal: `${open}-${initialDate?.toISOString() ?? ''}-${initialDutyType ?? ''}`,
  });
  const { assignDuty, loading } = useDutyActions(() => {
    onSuccess();
    resetForm();
    setAttempted(false);
    onOpenChange(false);
  });
  
  const [attempted, setAttempted] = useState(false);

  const hasEmployee = !!(formData.employee_id || manualName.trim());
  const hasDates = formData.dates.length > 0;
  const canSubmit = hasEmployee && hasDates;

  const handleSubmit = async () => {
    setAttempted(true);
    
    if (!hasEmployee) {
      toast({
        title: t('common.error'),
        description: t('duty.noEmployeeSelected'),
        variant: 'destructive',
      });
      return;
    }

    if (!hasDates) {
      toast({
        title: t('common.error'),
        description: t('duty.noDatesSelected'),
        variant: 'destructive',
      });
      return;
    }

    await assignDuty(
      formData.duty_type,
      formData.employee_id,
      formData.dates,
      formData.notes,
      manualName.trim()
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
      setAttempted(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('duty.assignEmployee')}</DialogTitle>
        </DialogHeader>

        <Tabs
          value={formData.duty_type}
          onValueChange={(value) => setDutyType(value as 'skadeleder_vagt' | 'kørevagt')}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="skadeleder_vagt" className="gap-2">
              <Shield className="h-4 w-4" />
              {t('duty.skadelederVagt')}
            </TabsTrigger>
            <TabsTrigger value="kørevagt" className="gap-2">
              <Car className="h-4 w-4" />
              {t('duty.kørevagt')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={formData.duty_type} className="space-y-4">
            <div className={`space-y-2 ${!hasEmployee && attempted ? 'ring-2 ring-red-500 rounded-md p-2' : ''}`}>
              <Label className={!hasEmployee && attempted ? 'text-red-500' : ''}>
                {t('duty.selectEmployee')} *
              </Label>
              <DutyEmployeeSelector
                employees={employees}
                selectedEmployeeId={formData.employee_id}
                onSelectEmployee={setEmployeeId}
                dutyType={formData.duty_type}
              />
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('common.or')}
                  </span>
                </div>
              </div>
              
              <Label>{t('duty.enterNameManually')}</Label>
              <Input 
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder={t('duty.enterName')}
              />
            </div>

            <div className={`space-y-2 ${!hasDates && attempted ? 'ring-2 ring-red-500 rounded-md p-2' : ''}`}>
              <Label className={!hasDates && attempted ? 'text-red-500' : ''}>
                {t('duty.selectDates')} *
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('duty.multipleSelection')}
              </p>
              <DutyCalendar
                selectedDates={formData.dates}
                onSelectDates={setDates}
                duties={duties}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t('duty.notes')} ({t('duty.optional')})
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('duty.notes')}
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2 pt-4">
              {!canSubmit && attempted && (
                <p className="text-xs text-red-500">
                  * {t('common.required')}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setAttempted(false);
                    onOpenChange(false);
                  }}
                  disabled={loading}
                >
                  {t('duty.cancel')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                  className={!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.saving')}
                    </>
                  ) : (
                    t('duty.assign')
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
