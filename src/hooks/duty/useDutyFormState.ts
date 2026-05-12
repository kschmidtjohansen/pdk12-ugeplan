import { useEffect, useState } from 'react';
import type { DutyFormData, DutyType } from '@/types/duty';

interface UseDutyFormStateOptions {
  initialDate?: Date | null;
  initialDutyType?: DutyType;
  resetSignal?: unknown;
}

export const useDutyFormState = (options: UseDutyFormStateOptions = {}) => {
  const { initialDate, initialDutyType, resetSignal } = options;

  const buildInitial = (): DutyFormData => ({
    duty_type: initialDutyType ?? 'kørevagt',
    employee_id: '',
    dates: initialDate ? [initialDate] : [],
    notes: '',
  });

  const [formData, setFormData] = useState<DutyFormData>(buildInitial);
  const [manualName, setManualName] = useState('');

  useEffect(() => {
    setFormData(buildInitial());
    setManualName('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  const setDutyType = (dutyType: DutyType) => {
    setFormData(prev => ({ ...prev, duty_type: dutyType }));
  };

  const setEmployeeId = (employeeId: string) => {
    setFormData(prev => ({ ...prev, employee_id: employeeId }));
  };

  const setDates = (dates: Date[]) => {
    setFormData(prev => ({ ...prev, dates }));
  };

  const setNotes = (notes: string) => {
    setFormData(prev => ({ ...prev, notes }));
  };

  const resetForm = () => {
    setFormData(buildInitial());
    setManualName('');
  };

  return {
    formData,
    manualName,
    setDutyType,
    setEmployeeId,
    setDates,
    setNotes,
    setManualName,
    resetForm,
  };
};
