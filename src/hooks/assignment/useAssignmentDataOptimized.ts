
import { useState, useEffect, useCallback } from 'react';
import { Assignment } from '@/types/assignment';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { enhancedDataFetching } from '@/services/enhancedDataFetching';
import { enhancedErrorHandler } from '@/services/enhancedErrorHandler';
import { useAuth } from '@/context/AuthContext';
import { resolveEmployeeDisplayName, filterDisplayNames } from '@/utils/people';
import { format } from 'date-fns';

export const useAssignmentDataOptimized = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isDemoMode } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (import.meta.env.DEV) console.log('[useAssignmentDataOptimized] ENHANCED - Starting enhanced fetch...');
      
      const assignmentResult = await enhancedDataFetching.fetchAssignmentsEnhanced(user?.email);
      
      if (assignmentResult.error || !assignmentResult.data) {
        throw assignmentResult.error || new Error('No assignment data received');
      }

      const assignmentsWithEmployees = assignmentResult.data;
      if (import.meta.env.DEV) console.log(`[useAssignmentDataOptimized] ENHANCED - Fetched ${assignmentsWithEmployees.length} assignment records`);
      
      if (!assignmentsWithEmployees || assignmentsWithEmployees.length === 0) {
        if (import.meta.env.DEV) console.log('[useAssignmentDataOptimized] ENHANCED - No assignments found');
        setAssignments([]);
        return;
      }
      
      const transformedAssignments: Assignment[] = assignmentsWithEmployees.map(assignment => {
        const teamData = assignment.team || [];
        const assignedEmployees = Array.isArray(teamData) ? teamData.map(member => ({
          id: member.id || '',
          name: resolveEmployeeDisplayName(member) || 'Unknown User',
          email: member.email || ''
        })) : [];
        
        const employeeNames = filterDisplayNames(assignedEmployees.map(emp => emp.name));
        
        const responsibleUser = assignment.responsible_user && typeof assignment.responsible_user === 'object' ? {
          id: assignment.responsible_user.id || '',
          name: assignment.responsible_user.name || '',
          email: assignment.responsible_user.email || ''
        } : null;
        
        const rawDate = assignment.assignment_date;
        let dateStr: string;

        if (!rawDate) {
          dateStr = '';
        } else if (rawDate instanceof Date) {
          dateStr = format(rawDate, 'yyyy-MM-dd');
        } else if (typeof rawDate === 'string') {
          dateStr = rawDate.split('T')[0];
        } else {
          dateStr = String(rawDate).split('T')[0];
        }
        
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: dateStr,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          employees: employeeNames,
          assignedEmployees: assignedEmployees,
          cars: assignment.car_ids || (assignment.car_id ? [assignment.car_id] : []),
          car: assignment.car_id || (assignment.car_ids && assignment.car_ids.length > 0 ? assignment.car_ids[0] : ''),
          published: assignment.published || false,
          responsibleUser: responsibleUser,
          responsibleUserId: assignment.responsible_user_id,
          type: assignment.type || 'other',
          case_number: assignment.case_number
        };
      });

      // RLS handles data isolation — no local merge needed
      
      if (import.meta.env.DEV) console.log(`[useAssignmentDataOptimized] ENHANCED - Successfully processed ${transformedAssignments.length} assignments`);
      setAssignments(transformedAssignments);
      
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useAssignmentDataOptimized] ENHANCED - Error:', err);
      
      const serializedError = enhancedErrorHandler.serializeError(err);
      const category = enhancedErrorHandler.categorizeError(serializedError);
      const userFriendlyMessage = enhancedErrorHandler.getUserFriendlyMessage(serializedError, category);
      
      setError(userFriendlyMessage);
      
      await enhancedErrorHandler.logError(err, {
        operation: 'fetchAssignments',
        additionalData: { 
          context: 'useAssignmentDataOptimized',
          component: 'assignment_data_hook',
          category
        }
      });
      
      if (category !== 'auth' && !isDemoMode) {
        toast({
          title: t('common.error') || 'Error',
          description: userFriendlyMessage,
          variant: 'destructive',
        });
      } else if (isDemoMode) {
        if (import.meta.env.DEV) console.log('[useAssignmentDataOptimized] Demo mode: Suppressed error toast', { category, error: userFriendlyMessage });
      }
      
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t, user?.email]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout;
    
    const channel = supabase
      .channel('assignment_changes_optimized')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, (payload) => {
        if (import.meta.env.DEV) console.log('[useAssignmentDataOptimized] Assignment change detected:', payload.eventType);
        
        enhancedDataFetching.clearCache('assignments');
        
        if (isDemoMode) {
          if (import.meta.env.DEV) console.log('[useAssignmentDataOptimized] Demo user - immediate fetch');
          fetchAssignments();
        } else {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            fetchAssignments();
          }, 500);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments_employees' }, (payload) => {
        if (import.meta.env.DEV) console.log('[useAssignmentDataOptimized] Assignment employee change detected:', payload.eventType);
        
        enhancedDataFetching.clearCache('assignments');
        
        if (isDemoMode) {
          if (import.meta.env.DEV) console.log('[useAssignmentDataOptimized] Demo user - immediate fetch for employee changes');
          fetchAssignments();
        } else {
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            fetchAssignments();
          }, 500);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (import.meta.env.DEV) console.log('[useAssignmentDataOptimized] Profile change detected');
        
        enhancedDataFetching.clearCache('assignments');
        
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          fetchAssignments();
        }, 1000);
      })
      .subscribe();
      
    return () => {
      clearTimeout(debounceTimeout);
      supabase.removeChannel(channel);
    };
  }, [fetchAssignments, isDemoMode]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments
  };
};
