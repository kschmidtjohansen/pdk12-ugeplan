import { useState } from 'react';
import { notifyOwnAction } from '@/lib/realtimeUtils';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useNotifications } from '@/context/NotificationContext';
import { useDutyNotifications } from '@/hooks/notifications/dutyNotifications';
import { toast } from 'sonner';
import { useTranslation } from '@/context/TranslationContext';
import type { DutyType } from '@/types/duty';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export const useDutyActions = (onSuccess?: () => void) => {
  const { user } = useAuth();
  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const { createDutyAssignmentNotification, createDutySwapOfferNotification } = useDutyNotifications(addNotification);
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
    notifyOwnAction();
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
        department_id: selectedDepartmentId || null,
        sub_department_id: selectedSubDepartmentId || null,
        ...(isDemoMode && { is_demo: true }),
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
      if (import.meta.env.DEV) console.error('Error assigning duty:', err);
      const errorMessage = (err as any)?.message || '';
      
      if (errorMessage.includes('row-level security') || errorMessage.includes('skadeleder') || errorMessage.includes('administrator')) {
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
    notifyOwnAction();
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
      if (import.meta.env.DEV) console.error('Error updating duty:', err);
      const errorMessage = (err as any)?.message || '';
      
      // Check for role validation error
      if (errorMessage.includes('row-level security') || errorMessage.includes('skadeleder') || errorMessage.includes('administrator')) {
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
      if (import.meta.env.DEV) console.error('Error removing duty:', err);
      toast.error((err as any)?.message || 'Failed to remove duty');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reassignDuty = async (dutyId: string, newEmployeeId: string) => {
    notifyOwnAction();
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
      if (import.meta.env.DEV) console.error('Error reassigning duty:', err);
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
    notifyOwnAction();
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
      if (import.meta.env.DEV) console.error('Error swapping duty:', error);
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
    notifyOwnAction();
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
      if (import.meta.env.DEV) console.error('Error swapping duties:', error);
      toast.error((error as any)?.message || t('duty.swapFailed'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createSwapRequest = async (
    duty: { id: string; duty_type: DutyType; duty_date: string; department_id?: string | null },
    candidateIds: string[],
  ): Promise<boolean> => {
    notifyOwnAction();
    if (!user) return false;
    if (candidateIds.length === 0) {
      toast.error(t('duty.noEmployeeSelected'));
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('duty_swap_requests')
        .insert({
          duty_id: duty.id,
          requested_by: user.id,
          candidate_ids: candidateIds,
          department_id: duty.department_id ?? null,
        });
      if (error) throw error;

      // Notify each candidate
      const requesterName = user.name || user.email || 'Kollega';
      await createDutySwapOfferNotification(
        candidateIds,
        duty.duty_type,
        duty.duty_date,
        requesterName,
      );

      toast.success(t('duty.swapRequestSent'));
      queryClient.invalidateQueries({ queryKey: ['duty_swap_requests'] });
      onSuccess?.();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error creating swap request:', err);
      toast.error((err as any)?.message || t('duty.swapRequestFailed'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const acceptSwapRequest = async (
    requestId: string,
  ): Promise<{ status: string }> => {
    notifyOwnAction();
    if (!user) return { status: 'unauthenticated' };

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('accept_duty_swap', {
        _request_id: requestId,
      });
      if (error) throw error;
      const status = (data as unknown as string) || 'unknown';
      if (status === 'accepted') {
        toast.success(t('duty.swapAcceptedSuccess'));
      }
      queryClient.invalidateQueries({ queryKey: ['duty_swap_requests'] });
      queryClient.invalidateQueries({ queryKey: ['duties'] });
      onSuccess?.();
      return { status };
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error accepting swap:', err);
      toast.error((err as any)?.message || t('duty.swapAcceptFailed'));
      return { status: 'error' };
    } finally {
      setLoading(false);
    }
  };

  const cancelSwapRequest = async (requestId: string): Promise<boolean> => {
    notifyOwnAction();
    if (!user) return false;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cancel_duty_swap', {
        _request_id: requestId,
      });
      if (error) throw error;
      const status = (data as unknown as string) || 'unknown';
      if (status === 'cancelled') {
        toast.success(t('duty.swapRequestCancelled'));
      }
      queryClient.invalidateQueries({ queryKey: ['duty_swap_requests'] });
      onSuccess?.();
      return status === 'cancelled';
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error cancelling swap:', err);
      toast.error((err as any)?.message || t('duty.swapRequestFailed'));
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
    createSwapRequest,
    acceptSwapRequest,
    cancelSwapRequest,
    loading
  };
};
