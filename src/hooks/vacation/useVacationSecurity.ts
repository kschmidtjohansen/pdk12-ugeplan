
import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logSecurityEvent } from '@/utils/securityLogger';
import { Vacation } from '@/types/vacation';
import { supabase } from '@/integrations/supabase/client';

export const useVacationSecurity = () => {
  const { user, isAdmin, isSkadeleder } = useAuth();
  const [skadelederSubDeptUserIds, setSkadelederSubDeptUserIds] = useState<Set<string>>(new Set());

  // For skadeledere: fetch user_ids in their sub-departments
  useEffect(() => {
    if (!isSkadeleder || !user?.id) return;

    const fetchSubDeptUsers = async () => {
      try {
        // Get skadeleder's sub_department_ids
        const { data: accessData } = await supabase
          .from('user_access')
          .select('sub_department_id')
          .eq('user_id', user.id)
          .not('sub_department_id', 'is', null);

        const subDeptIds = (accessData || []).map(a => a.sub_department_id).filter(Boolean) as string[];
        if (subDeptIds.length === 0) {
          setSkadelederSubDeptUserIds(new Set());
          return;
        }

        // Get all user_ids in those sub-departments
        const { data: usersInSubDepts } = await supabase
          .from('user_access')
          .select('user_id')
          .in('sub_department_id', subDeptIds);

        const userIds = new Set((usersInSubDepts || []).map(u => u.user_id));
        setSkadelederSubDeptUserIds(userIds);
        if (import.meta.env.DEV) console.log(`[useVacationSecurity] Skadeleder has access to ${userIds.size} users in ${subDeptIds.length} sub-departments`);
      } catch (error) {
        if (import.meta.env.DEV) console.error('[useVacationSecurity] Failed to fetch sub-department users:', error);
      }
    };

    fetchSubDeptUsers();
  }, [isSkadeleder, user?.id]);

  // Security logging for vacation operations
  const logVacationSecurityEvent = useCallback(async (
    eventType: string,
    vacationId: string,
    details: Record<string, any> = {}
  ) => {
    try {
      await logSecurityEvent(
        `vacation_${eventType}`,
        `Vacation security event: ${eventType}`,
        {
          vacation_id: vacationId,
          user_id: user?.id,
          user_role: user?.role,
          ...details
        },
        'info'
      );
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to log vacation security event:', error);
    }
  }, [user]);

  // Check if user can view a specific vacation
  const canViewVacation = useCallback((vacation: Vacation): boolean => {
    if (!user) return false;
    
    // User can view their own vacation
    if (vacation.user_id === user.id) return true;
    
    // Admin can view all
    if (isAdmin) return true;
    
    // Skadeleder can view vacations for users in their sub-departments
    if (isSkadeleder && skadelederSubDeptUserIds.has(vacation.user_id)) return true;
    
    return false;
  }, [user, isAdmin, isSkadeleder, skadelederSubDeptUserIds]);

  // Check if user can edit a specific vacation
  const canEditVacation = useCallback((vacation: Vacation): boolean => {
    if (!user) return false;
    
    const canEdit = (vacation.user_id === user.id && vacation.status === 'pending') || 
                    isAdmin || isSkadeleder;
    
    return canEdit;
  }, [user, isAdmin, isSkadeleder]);

  // Check if user can delete a specific vacation
  const canDeleteVacation = useCallback((vacation: Vacation): boolean => {
    if (!user) return false;
    
    const canDelete = (vacation.user_id === user.id && vacation.status === 'pending') || 
                      isAdmin || isSkadeleder;
    
    return canDelete;
  }, [user, isAdmin, isSkadeleder]);

  // Check if user can approve/reject vacations
  const canManageVacationStatus = useCallback((): boolean => {
    return isAdmin || isSkadeleder;
  }, [isAdmin, isSkadeleder]);

  return {
    canViewVacation,
    canEditVacation,
    canDeleteVacation,
    canManageVacationStatus,
    logVacationSecurityEvent
  };
};
