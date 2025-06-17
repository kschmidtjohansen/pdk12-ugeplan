
import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { logSecurityEvent } from '@/utils/securityLogger';
import { Vacation } from '@/types/vacation';

export const useVacationSecurity = () => {
  const { user, isAdmin, isSkadeleder } = useAuth();

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
      console.error('Failed to log vacation security event:', error);
    }
  }, [user]);

  // Check if user can view a specific vacation
  const canViewVacation = useCallback((vacation: Vacation): boolean => {
    if (!user) return false;
    
    // User can view their own vacation or admin/skadeleder can view all
    const canView = vacation.user_id === user.id || isAdmin || isSkadeleder;
    
    if (!canView) {
      logVacationSecurityEvent('unauthorized_view_attempt', vacation.id, {
        attempted_vacation_user_id: vacation.user_id,
        reason: 'User attempted to view vacation they do not own'
      });
    }
    
    return canView;
  }, [user, isAdmin, isSkadeleder, logVacationSecurityEvent]);

  // Check if user can edit a specific vacation
  const canEditVacation = useCallback((vacation: Vacation): boolean => {
    if (!user) return false;
    
    // User can edit their own pending vacation or admin/skadeleder can edit any
    const canEdit = (vacation.user_id === user.id && vacation.status === 'pending') || 
                    isAdmin || isSkadeleder;
    
    if (!canEdit) {
      logVacationSecurityEvent('unauthorized_edit_attempt', vacation.id, {
        attempted_vacation_user_id: vacation.user_id,
        vacation_status: vacation.status,
        reason: 'User attempted to edit vacation without permission'
      });
    }
    
    return canEdit;
  }, [user, isAdmin, isSkadeleder, logVacationSecurityEvent]);

  // Check if user can delete a specific vacation
  const canDeleteVacation = useCallback((vacation: Vacation): boolean => {
    if (!user) return false;
    
    // User can delete their own pending vacation or admin/skadeleder can delete any
    const canDelete = (vacation.user_id === user.id && vacation.status === 'pending') || 
                      isAdmin || isSkadeleder;
    
    if (!canDelete) {
      logVacationSecurityEvent('unauthorized_delete_attempt', vacation.id, {
        attempted_vacation_user_id: vacation.user_id,
        vacation_status: vacation.status,
        reason: 'User attempted to delete vacation without permission'
      });
    }
    
    return canDelete;
  }, [user, isAdmin, isSkadeleder, logVacationSecurityEvent]);

  // Check if user can approve/reject vacations
  const canManageVacationStatus = useCallback((): boolean => {
    const canManage = isAdmin || isSkadeleder;
    
    if (!canManage && user) {
      logVacationSecurityEvent('unauthorized_manage_attempt', 'general', {
        reason: 'User attempted to manage vacation status without admin/skadeleder role'
      });
    }
    
    return canManage;
  }, [isAdmin, isSkadeleder, user, logVacationSecurityEvent]);

  return {
    canViewVacation,
    canEditVacation,
    canDeleteVacation,
    canManageVacationStatus,
    logVacationSecurityEvent
  };
};
