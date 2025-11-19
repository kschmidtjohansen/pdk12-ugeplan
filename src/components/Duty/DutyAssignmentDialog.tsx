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
import { Shield, Car } from 'lucide-react';
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
}

export const DutyAssignmentDialog = ({
  open,
  onOpenChange,
  employees,
  duties,
  onSuccess,
}: DutyAssignmentDialogProps) => {
  const { t } = useTranslation();
  const { formData, manualName, setDutyType, setEmployeeId, setDates, setNotes, setManualName, resetForm } = useDutyFormState();
  const { assignDuty, loading } = useDutyActions(() => {
    onSuccess();
    resetForm();
    onOpenChange(false);
  });

  const canSubmit = (formData.employee_id || manualName.trim()) && formData.dates.length > 0;

  const handleSubmit = async () => {
    if (!formData.employee_id && !manualName.trim()) {
      toast({
        title: t('common.error'),
        description: t('duty.noEmployeeSelected'),
        variant: 'destructive'
      });
      return;
    }

    if (formData.dates.length === 0) {
      toast({
        title: t('common.error'),
        description: t('duty.noDatesSelected'),
        variant: 'destructive'
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-2">
              <Label>{t('duty.selectEmployee')}</Label>
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

            <div className="space-y-2">
              <Label>
                {t('duty.selectDates')}
                <span className="text-xs text-muted-foreground ml-2">
                  {t('duty.multipleSelection')}
                </span>
              </Label>
              <DutyCalendar
                selectedDates={formData.dates}
                onSelectDates={setDates}
                duties={duties}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t('duty.notes')}
                <span className="text-xs text-muted-foreground ml-2">
                  ({t('duty.optional')})
                </span>
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('duty.notes')}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
                disabled={loading}
              >
                {t('duty.cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
              >
                {loading ? t('common.saving') : t('duty.assign')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
