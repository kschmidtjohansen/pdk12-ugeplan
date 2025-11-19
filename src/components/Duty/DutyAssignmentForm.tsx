import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/context/TranslationContext';
import { DutyEmployeeSelector } from './DutyEmployeeSelector';
import { DutyCalendar } from './DutyCalendar';
import { useDutyFormState } from '@/hooks/duty/useDutyFormState';
import { useDutyActions } from '@/hooks/duty/useDutyActions';
import type { Duty, DutyType } from '@/types/duty';
import { format } from 'date-fns';
import { da, enUS } from 'date-fns/locale';

interface Employee {
  id: string;
  name: string;
  role?: string;
}

interface DutyAssignmentFormProps {
  employees: Employee[];
  duties: Duty[];
  onSuccess: () => void;
}

export const DutyAssignmentForm = ({
  employees,
  duties,
  onSuccess,
}: DutyAssignmentFormProps) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : enUS;
  const { formData, setDutyType, setEmployeeId, setDates, setNotes, resetForm } = useDutyFormState();
  const { assignDuty, loading } = useDutyActions(() => {
    resetForm();
    onSuccess();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employee_id || formData.dates.length === 0) {
      return;
    }

    await assignDuty(
      formData.duty_type,
      formData.employee_id,
      formData.dates,
      formData.notes
    );
  };

  const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-4 block">
            {t('duty.assignEmployee')}
          </Label>
          <Tabs
            value={formData.duty_type}
            onValueChange={(value) => setDutyType(value as DutyType)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="skadeleder_vagt">
                {t('duty.skadelederVagt')}
              </TabsTrigger>
              <TabsTrigger value="kørevagt">
                {t('duty.kørevagt')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="skadeleder_vagt" className="space-y-4 mt-4">
              <div>
                <Label>{t('duty.selectEmployee')}</Label>
                <DutyEmployeeSelector
                  employees={employees}
                  selectedEmployeeId={formData.employee_id}
                  onSelectEmployee={setEmployeeId}
                  dutyType="skadeleder_vagt"
                />
              </div>
            </TabsContent>

            <TabsContent value="kørevagt" className="space-y-4 mt-4">
              <div>
                <Label>{t('duty.selectEmployee')}</Label>
                <DutyEmployeeSelector
                  employees={employees}
                  selectedEmployeeId={formData.employee_id}
                  onSelectEmployee={setEmployeeId}
                  dutyType="kørevagt"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Label className="mb-2 block">{t('duty.selectDates')}</Label>
          <DutyCalendar
            selectedDates={formData.dates}
            onSelectDates={setDates}
            duties={duties}
          />
        </div>

        {formData.dates.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {t('duty.selectDates')}: {formData.dates.map(date => 
              format(date, 'dd/MM/yyyy', { locale })
            ).join(', ')}
          </div>
        )}

        <div>
          <Label htmlFor="notes">
            {t('duty.notes')} ({t('duty.optional')})
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('duty.notes')}
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!formData.employee_id || formData.dates.length === 0 || loading}
            className="flex-1"
          >
            {loading ? t('common.loading') : t('duty.assign')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={loading}
          >
            {t('duty.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
};
