
import { useState, useEffect, useCallback } from 'react';
import { Assignment } from '@/types/assignment';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { enhancedDataFetching } from '@/services/enhancedDataFetching';
import { enhancedErrorHandler } from '@/services/enhancedErrorHandler';

export const useAssignmentDataOptimized = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentDataOptimized] ENHANCED - Starting enhanced fetch...');
      
      // Use enhanced data fetching with proper error handling
      const assignmentResult = await enhancedDataFetching.fetchAssignmentsEnhanced();
      
      if (assignmentResult.error || !assignmentResult.data) {
        throw assignmentResult.error || new Error('No assignment data received');
      }

      const assignmentsWithEmployees = assignmentResult.data;
      console.log(`[useAssignmentDataOptimized] ENHANCED - Fetched ${assignmentsWithEmployees.length} assignment records`);
      
      if (!assignmentsWithEmployees || assignmentsWithEmployees.length === 0) {
        console.log('[useAssignmentDataOptimized] ENHANCED - No assignments found');
        setAssignments([]);
        return;
      }
      
      // Enhanced data transformation with better error handling
      const transformedAssignments: Assignment[] = assignmentsWithEmployees.map(assignment => {
        // Extract employee data from the nested structure
        const assignedEmployees = (assignment.assignments_employees || [])
          .map(ae => ({
            id: ae.profiles?.id || ae.user_id,
            name: ae.profiles?.name || 'Unknown',
            email: ae.profiles?.email || 'unknown@example.com'
          }))
          .filter(emp => emp.name && emp.name !== 'Unknown');
        
        const employeeNames = assignedEmployees.map(emp => emp.name);
        
        // Handle responsible user data
        const responsibleUser = assignment.responsible_user && typeof assignment.responsible_user === 'object' ? {
          id: assignment.responsible_user.id || '',
          name: assignment.responsible_user.name || '',
          email: assignment.responsible_user.email || ''
        } : null;
        
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description || '',
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          employees: employeeNames, // Legacy format for backward compatibility
          assignedEmployees: assignedEmployees, // Complete employee data with IDs
          cars: assignment.car_ids || (assignment.car_id ? [assignment.car_id] : []),
          car: assignment.car_id || (assignment.car_ids && assignment.car_ids.length > 0 ? assignment.car_ids[0] : ''),
          published: assignment.published || false,
          responsibleUser: responsibleUser,
          responsibleUserId: assignment.responsible_user_id,
          type: assignment.type || 'other'
        };
      });
      
      console.log(`[useAssignmentDataOptimized] ENHANCED - Successfully processed ${transformedAssignments.length} assignments`);
      setAssignments(transformedAssignments);
      
    } catch (err) {
      console.error('[useAssignmentDataOptimized] ENHANCED - Error:', err);
      
      // Enhanced error handling with proper serialization  
      const serializedError = enhancedErrorHandler.serializeError(err);
      const category = enhancedErrorHandler.categorizeError(serializedError);
      const userFriendlyMessage = enhancedErrorHandler.getUserFriendlyMessage(serializedError, category);
      
      setError(userFriendlyMessage);
      
      // Log error with enhanced context
      await enhancedErrorHandler.logError(err, {
        operation: 'fetchAssignments',
        additionalData: { 
          context: 'useAssignmentDataOptimized',
          component: 'assignment_data_hook',
          category
        }
      });
      
      // Only show toast for non-auth errors to avoid spam
      if (category !== 'auth') {
        toast({
          title: t('common.error') || 'Error',
          description: userFriendlyMessage,
          variant: 'destructive',
        });
      }
      
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  // Load assignments on mount
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('assignment_changes_optimized')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        console.log('[useAssignmentDataOptimized] Assignment change detected, refreshing...');
        fetchAssignments();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments_employees' }, () => {
        console.log('[useAssignmentDataOptimized] Assignment employee change detected, refreshing...');
        fetchAssignments();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments
  };
};
