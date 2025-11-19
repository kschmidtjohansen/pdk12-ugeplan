import { useState } from 'react';
import type { DutyFormData, DutyType } from '@/types/duty';

export const useDutyFormState = () => {
  const [formData, setFormData] = useState<DutyFormData>({
    duty_type: 'kørevagt',
    employee_id: '',
    dates: [],
    notes: '',
  });
  const [manualName, setManualName] = useState('');

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
    setFormData({
      duty_type: 'kørevagt',
      employee_id: '',
      dates: [],
      notes: '',
    });
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
