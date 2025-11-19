import { useState } from 'react';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useDutyNotifications } from '@/hooks/notifications/dutyNotifications';
import { toast } from 'sonner';
import { useTranslation } from '@/context/TranslationContext';
import type { DutyType } from '@/types/duty';
import { format } from 'date-fns';

export const useDutyActions = (onSuccess?: () => void) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const { createDutyAssignmentNotification } = useDutyNotifications(addNotification);
  const [loading, setLoading] = useState(false);

  // Helper to extract initials from name
  const getInitials = (name: string): string => {
    return name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const assignDuty = async (
    dutyType: DutyType,
    employeeId: string,
    dates: Date[],
    notes?: string,
    manualName?: string
  ) => {
    if (!user) return false;

    try {
      setLoading(true);
      const isDemoMode = user.email === 'test@polygongroup.com';
      const client = getSchemaClient(isDemoMode);

      // If manual name is provided, use it instead of employee_id
      const useManualName = manualName && manualName.trim() && !employeeId;
      const initials = useManualName ? getInitials(manualName) : '';
      const notesWithManualName = useManualName 
        ? `EKSTERN: ${manualName} [${initials}]${notes ? '\n' + notes : ''}`
        : notes || null;

      const duties = dates.map(date => ({
        duty_type: dutyType,
        employee_id: useManualName ? null : employeeId,
        duty_date: format(date, 'yyyy-MM-dd'),
        notes: notesWithManualName,
        created_by: user.id,
      }));

      const { error } = await client
        .from('on_call_duties')
        .insert(duties);

      if (error) throw error;

      // Only create notification if it's an actual employee (not manual entry)
      if (employeeId && !useManualName) {
        await createDutyAssignmentNotification(employeeId, dutyType, dates);
      }

      toast.success(t('duty.assignSuccess'));
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error assigning duty:', err);
      const errorMessage = err instanceof Error ? err.message : '';
      
      if (errorMessage.includes('skadeleder') || errorMessage.includes('administrator')) {
        toast.error(t('duty.assignFailed'));
      } else {
        toast.error(errorMessage || t('duty.assignFailedGeneric'));
      }
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
