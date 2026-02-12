import { useState } from 'react';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useDutyNotifications } from '@/hooks/notifications/dutyNotifications';
import { toast } from 'sonner';
import { useTranslation } from '@/context/TranslationContext';
import type { DutyType } from '@/types/duty';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export const useDutyActions = (onSuccess?: () => void) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const { createDutyAssignmentNotification } = useDutyNotifications(addNotification);
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: ['duties'] });
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
    updates: { employee_id?: string; notes?: string; duty_type?: DutyType }
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
      queryClient.invalidateQueries({ queryKey: ['duties'] });
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error updating duty:', err);
      const errorMessage = err instanceof Error ? err.message : '';
      
      // Check for role validation error
      if (errorMessage.includes('skadeleder') || errorMessage.includes('administrator')) {
        toast.error(t('duty.roleValidationFailed'));
      } else {
        toast.error(errorMessage || t('duty.updateFailed'));
      }
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
      queryClient.invalidateQueries({ queryKey: ['duties'] });
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

  const reassignDuty = async (dutyId: string, newEmployeeId: string) => {
    if (!user) return false;

    try {
      setLoading(true);
      const isDemoMode = user.email === 'test@polygongroup.com';
      const client = getSchemaClient(isDemoMode);

      const { error } = await client
        .from('on_call_duties')
        .update({ employee_id: newEmployeeId })
        .eq('id', dutyId);

      if (error) throw error;

      toast.success(t('duty.dutyReassigned'));
      queryClient.invalidateQueries({ queryKey: ['duties'] });
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Error reassigning duty:', err);
      toast.error(t('duty.reassignFailed'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const swapDuty = async (
    dutyId: string,
    newEmployeeId: string,
    reason?: string
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const isDemoMode = user.email === 'test@polygongroup.com';
      const client = getSchemaClient(isDemoMode);

      const { data, error } = await client
        .from('on_call_duties')
        .update({ employee_id: newEmployeeId })
        .eq('id', dutyId)
        .select()
        .single();

      if (error) throw error;

      toast.success(t('duty.reassignSuccess'));
      queryClient.invalidateQueries({ queryKey: ['duties'] });
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Error swapping duty:', error);
      toast.error(t('duty.reassignFailed'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const swapDuties = async (
    duty1Id: string,
    duty2Id: string
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('swap-duties', {
        body: {
          duty1Id,
          duty2Id,
          requestedBy: user.id,
        },
      });

      if (error) throw error;

      toast.success(t('duty.swapSuccess'));
      queryClient.invalidateQueries({ queryKey: ['duties'] });
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Error swapping duties:', error);
      toast.error(error instanceof Error ? error.message : t('duty.swapFailed'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    assignDuty,
    updateDuty,
    removeDuty,
    reassignDuty,
    swapDuty,
    swapDuties,
    loading
  };
};
