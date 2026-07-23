import { useEffect, useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Car, Loader2, X } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyFormState } from '@/hooks/duty/useDutyFormState';
import { useDutyActions } from '@/hooks/duty/useDutyActions';
import { DutyCalendar } from './DutyCalendar';
import { toast } from '@/hooks/use-toast';
import type { Duty } from '@/types/duty';

interface Employee {
  id: string;
  name: string;
  role?: string;
  department_id?: string | null;
  department_name?: string | null;
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
  const { formData, manualName, setDutyType, setDates, setNotes, setManualName, resetForm } = useDutyFormState({
    initialDate,
    initialDutyType,
    resetSignal: `${open}-${initialDate?.toISOString() ?? ''}-${initialDutyType ?? ''}`,
  });
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);

  const { assignDuty, loading } = useDutyActions();

  // Reset multi-select when dialog opens/closes or initial values change
  useEffect(() => {
    setSelectedEmployeeIds([]);
    setAttempted(false);
  }, [open, initialDate, initialDutyType]);

  const filteredEmployees = useMemo(() => {
    return formData.duty_type === 'skadeleder_vagt'
      ? employees.filter(e => e.role === 'super_admin' || e.role === 'administrator' || e.role === 'skadeleder')
      : employees;
  }, [employees, formData.duty_type]);

  // Drop selections that are no longer eligible after a duty-type switch
  useEffect(() => {
    setSelectedEmployeeIds(prev => prev.filter(id => filteredEmployees.some(e => e.id === id)));
  }, [filteredEmployees]);

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const removeEmployee = (id: string) => {
    setSelectedEmployeeIds(prev => prev.filter(x => x !== id));
  };

  const hasEmployee = selectedEmployeeIds.length > 0 || !!manualName.trim();
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

    let allOk = true;

    // Manual external name → single insert (no employee selection)
    if (selectedEmployeeIds.length === 0 && manualName.trim()) {
      const ok = await assignDuty(formData.duty_type, '', formData.dates, formData.notes, manualName.trim());
      allOk = allOk && !!ok;
    } else {
      // Loop over each selected employee, creating duties for each on the chosen dates
      for (const empId of selectedEmployeeIds) {
        const ok = await assignDuty(formData.duty_type, empId, formData.dates, formData.notes, '');
        allOk = allOk && !!ok;
      }
    }

    if (allOk) {
      onSuccess();
      resetForm();
      setSelectedEmployeeIds([]);
      setAttempted(false);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
      setSelectedEmployeeIds([]);
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
              <div className="flex items-center justify-between">
                <Label className={!hasEmployee && attempted ? 'text-red-500' : ''}>
                  {t('duty.selectEmployee')} *
                </Label>
                {selectedEmployeeIds.length > 0 && (
                  <Badge variant="secondary">
                    {selectedEmployeeIds.length} {t('duty.selected') ?? 'valgt'}
                  </Badge>
                )}
              </div>

              {selectedEmployeeIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedEmployeeIds.map(id => {
                    const emp = employees.find(e => e.id === id);
                    if (!emp) return null;
                    return (
                      <Badge key={id} variant="outline" className="gap-1 pr-1">
                        {emp.name}
                        <button
                          type="button"
                          onClick={() => removeEmployee(id)}
                          className="ml-0.5 rounded hover:bg-muted p-0.5"
                          aria-label={t('common.remove') ?? 'Fjern'}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              <div className="border rounded-md">
                <ScrollArea className="h-[200px]">
                  <div className="p-2 space-y-1">
                    {filteredEmployees.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {t('duty.noEligibleEmployees')}
                      </p>
                    ) : (
                      filteredEmployees.map(emp => {
                        const checked = selectedEmployeeIds.includes(emp.id);
                        return (
                          <label
                            key={emp.id}
                            htmlFor={`assign-emp-${emp.id}`}
                            className={`flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer transition-colors hover:bg-muted/50 ${checked ? 'bg-primary/5' : ''}`}
                          >
                            <Checkbox
                              id={`assign-emp-${emp.id}`}
                              checked={checked}
                              onCheckedChange={() => toggleEmployee(emp.id)}
                            />
                            <span className="text-sm flex-1">{emp.name}</span>
                            {emp.department_name && (
                              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                {emp.department_name}
                              </Badge>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

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
                disabled={selectedEmployeeIds.length > 0}
              />
              {selectedEmployeeIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('duty.manualDisabledHint') ?? 'Ryd valgte medarbejdere for at indtaste navn manuelt.'}
                </p>
              )}
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
                    setSelectedEmployeeIds([]);
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
