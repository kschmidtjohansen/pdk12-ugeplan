import { useState } from 'react';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from '@/context/TranslationContext';
import type { DutyType } from '@/types/duty';

export const useDutyActions = (onSuccess?: () => void) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const assignDuty = async (
    dutyType: DutyType,
    employeeId: string,
    dates: Date[],
    notes?: string
  ) => {
    if (!user) return false;

    try {
      setLoading(true);
      const isDemoMode = user.email === 'test@polygongroup.com';
      const client = getSchemaClient(isDemoMode);

      const duties = dates.map(date => ({
        duty_type: dutyType,
        employee_id: employeeId,
        duty_date: date.toISOString().split('T')[0],
        notes: notes || null,
        created_by: user.id,
      }));

      const { error } = await client
        .from('on_call_duties')
        .insert(duties);

      if (error) throw error;

      toast.success(t('duty.assignSuccess'));
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error assigning duty:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to assign duty');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateDuty = async (
    dutyId: string,
    updates: { employee_id?: string; notes?: string }
  ) => {
    if (!user) return false;

    try {
      setLoading(true);
      const isDemoMode = user.email === 'test@polygongroup.com';
      const client = getSchemaClient(isDemoMode);

      const { error } = await client
        .from('on_call_duties')
        .update(updates)
        .eq('id', dutyId);

      if (error) throw error;

      toast.success(t('duty.updateSuccess'));
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error updating duty:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update duty');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeDuty = async (dutyId: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const isDemoMode = user.email === 'test@polygongroup.com';
      const client = getSchemaClient(isDemoMode);

      const { error } = await client
        .from('on_call_duties')
        .delete()
        .eq('id', dutyId);

      if (error) throw error;

      toast.success(t('duty.removeSuccess'));
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error removing duty:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove duty');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    assignDuty,
    updateDuty,
    removeDuty,
    loading
  };
};
