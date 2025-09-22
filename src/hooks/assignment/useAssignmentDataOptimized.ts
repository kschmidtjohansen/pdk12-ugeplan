
import { useState, useEffect, useCallback } from 'react';
import { Assignment } from '@/types/assignment';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { enhancedDataFetching } from '@/services/enhancedDataFetching';
import { enhancedErrorHandler } from '@/services/enhancedErrorHandler';
import { useAuth } from '@/context/AuthContext';
import { DemoUserFiltering } from '@/utils/demoUserFiltering';
import { DemoUserService } from '@/services/demoUserService';
import { resolveEmployeeDisplayName, filterDisplayNames } from '@/utils/people';
export const useAssignmentDataOptimized = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const demoService = DemoUserService.getInstance();

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useAssignmentDataOptimized] ENHANCED - Starting enhanced fetch...');
      
      // Use enhanced data fetching with proper error handling and user email for demo filtering
      const assignmentResult = await enhancedDataFetching.fetchAssignmentsEnhanced(user?.email);
      
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
      
      // Enhanced data transformation using new secure team data structure
      let transformedAssignments: Assignment[] = assignmentsWithEmployees.map(assignment => {
        // Extract employee data from the secure team structure
        const teamData = assignment.team || [];
        const assignedEmployees = Array.isArray(teamData) ? teamData.map(member => ({
          id: member.id || '',
          name: resolveEmployeeDisplayName(member) || 'Unknown User',
          email: member.email || ''
        })) : [];
        
        const employeeNames = filterDisplayNames(assignedEmployees.map(emp => emp.name));
        
        // Handle responsible user data from secure function
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

      // Apply demo user filtering
      transformedAssignments = DemoUserFiltering.filterAssignments(transformedAssignments, user?.email);
      
      // If this is a demo user, include their session-stored assignments
      if (demoService.isDemoUser(user?.email)) {
        const demoAssignments = demoService.getDemoAssignments().map(demoAssignment => ({
          id: demoAssignment.id,
          title: demoAssignment.title,
          description: demoAssignment.description || '',
          date: demoAssignment.assignment_date,
          fromTime: demoAssignment.from_time,
          toTime: demoAssignment.to_time,
          location: demoAssignment.location,
          employees: [],
          assignedEmployees: [],
          cars: demoAssignment.car_id ? [demoAssignment.car_id] : [],
          car: demoAssignment.car_id || '',
          published: demoAssignment.published || false,
          responsibleUser: null,
          responsibleUserId: demoAssignment.responsible_user_id,
          type: demoAssignment.type || 'other'
        }));
        
        transformedAssignments = [...transformedAssignments, ...demoAssignments];
        console.log(`[useAssignmentDataOptimized] Added ${demoAssignments.length} demo assignments from session storage`);
      }
      
      console.log(`[useAssignmentDataOptimized] ENHANCED - Successfully processed ${transformedAssignments.length} assignments (after demo filtering)`);
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
  }, [toast, t, user?.email]);

  // Load assignments on mount
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    let debounceTimeout: NodeJS.Timeout;
    
    const channel = supabase
      .channel('assignment_changes_optimized')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, (payload) => {
        console.log('[useAssignmentDataOptimized] Assignment change detected:', payload.eventType);
        
        // Clear cache to ensure fresh data
        enhancedDataFetching.clearCache('assignments');
        
        // For demo users, fetch immediately to ensure instant visibility
        if (user?.email === 'demo@example.com') {
          console.log('[useAssignmentDataOptimized] Demo user detected - immediate fetch');
          fetchAssignments();
        } else {
          // Debounce to prevent rapid-fire updates for regular users
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            fetchAssignments();
          }, 500);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments_employees' }, (payload) => {
        console.log('[useAssignmentDataOptimized] Assignment employee change detected:', payload.eventType);
        
        // Clear cache to ensure fresh data
        enhancedDataFetching.clearCache('assignments');
        
        // For demo users, fetch immediately to ensure instant visibility
        if (user?.email === 'demo@example.com') {
          console.log('[useAssignmentDataOptimized] Demo user detected - immediate fetch for employee changes');
          fetchAssignments();
        } else {
          // Debounce to prevent rapid-fire updates for regular users
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            fetchAssignments();
          }, 500);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('[useAssignmentDataOptimized] Profile change detected - this might affect employee names');
        
        // Clear cache to ensure fresh data
        enhancedDataFetching.clearCache('assignments');
        
        // Debounce to prevent rapid-fire updates
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
  }, [fetchAssignments, user?.email]);

  return {
    assignments,
    loading,
    error,
    fetchAssignments
  };
};
