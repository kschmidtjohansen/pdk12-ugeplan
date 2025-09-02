import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { OptimizedAssignmentService, OptimizedAssignmentData } from '@/services/optimizedAssignmentService';
import { Assignment, normalizeEmployees } from '@/types/assignment';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { sanitizeUUIDForDB } from '@/utils/uuidValidation';
import { useEmployeeData } from '@/hooks/employee/useEmployeeData';

export type FilterType = 'all' | 'published' | 'unpublished' | 'user';
export type AssignmentFilter = FilterType; // Export for compatibility

interface UseOptimizedAssignmentsResult {
  assignments: Assignment[];
  loading: boolean;
  error: Error | null;
  operationStates: Record<string, 'idle' | 'loading' | 'success' | 'error'>;
  refetch: () => Promise<void>;
  createAssignment: (data: Partial<Assignment>) => Promise<void>;
  updateAssignment: (id: string, data: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  publishAssignment: (id: string) => Promise<void>;
  publishAssignmentsByDate: (date: string) => Promise<void>;
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
}

// Helper function to convert OptimizedAssignmentData to Assignment
const convertToAssignment = (data: OptimizedAssignmentData): Assignment => {
  // Convert assignment_employees to employee IDs array and preserve full employee data
  const employees = data.assignment_employees?.map(emp => emp.user_id).filter(Boolean) || [];
  const assignedEmployees = data.assignment_employees?.map(emp => ({
    id: emp.user_id,
    name: emp.profiles?.name || emp.user_id,
    email: '' // Email not available in current structure
  })).filter(emp => emp.id) || [];
  
  // Handle car data - support both legacy car_id and new car_ids array
  let cars: string[] = [];
  let firstCar = '';
  
  if (data.assignment_cars && data.assignment_cars.length > 0) {
    // Use the enriched car data from the service
    cars = data.assignment_cars.map(car => car.id);
    firstCar = cars[0] || '';
  } else if (data.car_ids && Array.isArray(data.car_ids) && data.car_ids.length > 0) {
    // Fallback to car_ids array
    cars = data.car_ids;
    firstCar = cars[0] || '';
  } else if (data.car_id) {
    // Legacy single car_id
    cars = [data.car_id];
    firstCar = data.car_id;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description || '',
    date: data.assignment_date,
    fromTime: data.from_time,
    toTime: data.to_time,
    location: data.location,
    type: data.type,
    published: data.published,
    responsibleUserId: data.responsible_user_id || undefined,
    employees: employees,
    assignedEmployees: assignedEmployees,
    car: firstCar,
    cars: cars,
    case_number: data.case_number,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    responsibleUser: data.responsible_user
  };
};

export const useOptimizedAssignments = (filter: FilterType = 'all'): UseOptimizedAssignmentsResult => {
  const { user, isAuthenticated, authReady } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { employees: allEmployees } = useEmployeeData();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [operationStates, setOperationStates] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});

  const setOperationState = useCallback((id: string, state: 'idle' | 'loading' | 'success' | 'error') => {
    setOperationStates(prev => ({ ...prev, [id]: state }));
  }, []);

  const fetchAssignments = useCallback(async () => {
    if (!user?.id || !user?.role) {
      console.log('[useOptimizedAssignments] User not authenticated or role not available, skipping fetch');
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log(`[useOptimizedAssignments] ⭐ CRITICAL DEBUG: Fetching assignments with filter: ${filter} for user: ${user.email} (${user.role})`);
      
      let result: OptimizedAssignmentData[];
      
      switch (filter) {
        case 'all':
          console.log('[useOptimizedAssignments] ⭐ FILTER MATCH: all - calling fetchAllAssignments');
          result = await OptimizedAssignmentService.fetchAllAssignments(user.role);
          break;
        case 'published':
          console.log('[useOptimizedAssignments] ⭐ FILTER MATCH: published - calling fetchAllPublishedAssignments');
          result = await OptimizedAssignmentService.fetchAllPublishedAssignments();
          break;
        case 'unpublished':
          console.log('[useOptimizedAssignments] ⭐ FILTER MATCH: unpublished - calling fetchUnpublishedAssignments');
          result = await OptimizedAssignmentService.fetchUnpublishedAssignments(user.id, user.role);
          break;
        case 'user':
          console.log('[useOptimizedAssignments] ⭐ FILTER MATCH: user - calling fetchUserAssignments');
          result = await OptimizedAssignmentService.fetchUserAssignments(user.id, user.role);
          break;
        default:
          console.log('[useOptimizedAssignments] ⭐ FILTER MATCH: default - no assignments');
          result = [];
      }

      // Convert OptimizedAssignmentData to Assignment format
      const convertedAssignments = result.map(convertToAssignment);

      console.log(`[useOptimizedAssignments] Successfully fetched ${convertedAssignments.length} assignments`);
      if (convertedAssignments.length > 0) {
        console.log(`[useOptimizedAssignments] Sample assignment data:`, convertedAssignments[0]);
      }
      setAssignments(convertedAssignments);
    } catch (err) {
      console.error('[useOptimizedAssignments] Error fetching assignments:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch assignments'));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, user?.email, filter]);

  const refetch = useCallback(async () => {
    setLoading(true);
    // Clear cache before refetching
    OptimizedAssignmentService.clearCache();
    await fetchAssignments();
  }, [fetchAssignments]);

  const createAssignment = useCallback(async (data: Partial<Assignment>) => {
    const operationId = `create-${Date.now()}`;
    
    try {
      setOperationStates(prev => ({ ...prev, [operationId]: 'loading' }));
      
      // Validate required fields
      if (!data.title?.trim()) {
        throw new Error(t('planner.validation.titleRequired'));
      }
      if (!data.date) {
        throw new Error(t('planner.validation.dateRequired'));
      }
      if (!data.fromTime) {
        throw new Error(t('planner.validation.fromTimeRequired'));
      }
      if (!data.toTime) {
        throw new Error(t('planner.validation.toTimeRequired'));
      }
      if (!data.location?.trim()) {
        throw new Error(t('planner.validation.locationRequired'));
      }

      // Convert Assignment data to service format with UUID sanitization
      const serviceData = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        assignment_date: data.date,
        from_time: data.fromTime,
        to_time: data.toTime,
        location: data.location.trim(),
        type: data.type || null,
        published: data.published || false,
        responsible_user_id: sanitizeUUIDForDB(data.responsibleUserId),
        car_id: sanitizeUUIDForDB(typeof data.car === 'string' ? data.car : null),
        car_ids: data.cars || null,
        case_number: data.case_number?.trim() || null,
        employees: data.employees || [] // These are now employee IDs instead of names
      };

      console.log('[useOptimizedAssignments] Creating assignment with data:', serviceData);

      // Create optimistic assignment for immediate UI update
      const optimisticAssignment: Assignment = {
        id: `temp-${Date.now()}`,
        title: serviceData.title,
        description: serviceData.description,
        date: serviceData.assignment_date,
        fromTime: serviceData.from_time,
        toTime: serviceData.to_time,
        location: serviceData.location,
        type: serviceData.type,
        published: serviceData.published,
        responsibleUserId: serviceData.responsible_user_id,
        employees: serviceData.employees,
        car: serviceData.car_id,
        cars: serviceData.car_ids,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add optimistic assignment to state
      setAssignments(prev => [optimisticAssignment, ...prev]);

      // Call service to create assignment
      const createdAssignment = await OptimizedAssignmentService.createAssignment(serviceData);
      
      // Replace optimistic assignment with real one
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === optimisticAssignment.id 
            ? convertToAssignment(createdAssignment)
            : assignment
        )
      );

      setOperationStates(prev => ({ ...prev, [operationId]: 'success' }));
      
      toast({
        title: t('planner.assignmentCreated'),
        description: t('planner.assignmentCreatedMsg', { title: serviceData.title }),
      });

    } catch (error) {
      console.error('[useOptimizedAssignments] Create assignment error:', error);
      
      // Remove optimistic assignment on error
      setAssignments(prev => 
        prev.filter(assignment => !assignment.id.startsWith('temp-'))
      );
      
      setOperationStates(prev => ({ ...prev, [operationId]: 'error' }));
      
      const errorMessage = error instanceof Error ? error.message : t('common.error');
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: errorMessage,
      });
      
      throw error;
    }
  }, [toast, t, setAssignments, setOperationStates]);

  const updateAssignment = useCallback(async (id: string, data: Partial<Assignment>) => {
    setOperationState(id, 'loading');
    try {
      console.log('[useOptimizedAssignments] === UPDATE ASSIGNMENT DEBUG ===');
      console.log('[useOptimizedAssignments] Assignment ID:', id);
      console.log('[useOptimizedAssignments] Input data:', data);
      
      // Enhanced data validation with detailed logging
      if (!data.title?.trim()) {
        throw new Error('Title is required and cannot be empty');
      }
      if (!data.location?.trim()) {
        throw new Error('Location is required and cannot be empty');
      }
      if (!data.date) {
        throw new Error('Date is required');
      }
      if (!data.fromTime) {
        throw new Error('Start time is required');
      }
      if (!data.toTime) {
        throw new Error('End time is required');
      }
      
      // Find original assignment for proper optimistic update
      const originalAssignment = assignments.find(a => a.id === id);
      
      console.log('[useOptimizedAssignments] Available employees for lookup:', allEmployees.length);
      
      // Optimistically update the UI with proper employee and car data reconstruction
      setAssignments(prev => prev.map(assignment => {
        if (assignment.id === id) {
          const updatedAssignment = { ...assignment, ...data };
          
          // EMPLOYEE UPDATE FIX: Properly reconstruct assignedEmployees when employee IDs change
          if (data.employees !== undefined) {
            console.log('[useOptimizedAssignments] EMPLOYEE UPDATE - New employee IDs:', data.employees);
            updatedAssignment.employees = data.employees;
            
            // Reconstruct assignedEmployees from employee IDs using all available employees
            updatedAssignment.assignedEmployees = data.employees.map(employeeId => {
              const employee = allEmployees.find(emp => emp.id === employeeId);
              if (employee) {
                return {
                  id: employee.id,
                  name: employee.name,
                  email: employee.email
                };
              }
              // Fallback if employee not found in current list
              const existingEmployee = originalAssignment?.assignedEmployees?.find(emp => emp.id === employeeId);
              return existingEmployee || {
                id: employeeId,
                name: `Employee ${employeeId}`,
                email: ''
              };
            }).filter(Boolean);
            
            console.log('[useOptimizedAssignments] EMPLOYEE UPDATE - Reconstructed assignedEmployees:', updatedAssignment.assignedEmployees);
          }
          
          // CAR UPDATE FIX: Properly handle car updates 
          if (data.car !== undefined) {
            console.log('[useOptimizedAssignments] CAR UPDATE - New car:', data.car);
            // Extract string ID from car data (handle both string and object)
            const carId = typeof data.car === 'string' ? data.car : (data.car as any)?.id || '';
            updatedAssignment.car = carId;
            // If car is set, ensure it's also in the cars array
            if (carId) {
              updatedAssignment.cars = [carId];
            } else {
              updatedAssignment.cars = [];
            }
            console.log('[useOptimizedAssignments] CAR UPDATE - Updated car data:', {
              car: updatedAssignment.car,
              cars: updatedAssignment.cars
            });
          }
          
          // Handle multiple cars update
          if (data.cars !== undefined) {
            console.log('[useOptimizedAssignments] CARS UPDATE - New cars array:', data.cars);
            updatedAssignment.cars = data.cars;
            // Set the first car as the primary car
            updatedAssignment.car = data.cars.length > 0 ? data.cars[0] : '';
            console.log('[useOptimizedAssignments] CARS UPDATE - Updated car data:', {
              car: updatedAssignment.car,
              cars: updatedAssignment.cars
            });
          }
          
          return updatedAssignment;
        }
        return assignment;
      }));
      
      // Convert Assignment data to OptimizedAssignmentData format for service with UUID sanitization
      const serviceData = {
        title: data.title?.trim(),
        description: data.description?.trim() || null,
        assignment_date: data.date,
        from_time: data.fromTime,
        to_time: data.toTime,
        location: data.location?.trim(),
        published: data.published || false,
        responsible_user_id: sanitizeUUIDForDB(data.responsibleUserId),
        car_id: sanitizeUUIDForDB(typeof data.car === 'string' ? data.car : (data.car as any)?.id || null),
        car_ids: Array.isArray(data.cars) ? data.cars.filter(Boolean) : 
                 (data.car ? [typeof data.car === 'string' ? data.car : (data.car as any)?.id] : null),
        case_number: data.case_number?.trim() || null,
        employees: data.employees || [] // Include employee IDs for updates
      };
      
      console.log('[useOptimizedAssignments] Service data:', serviceData);
      
      await OptimizedAssignmentService.updateAssignment(id, serviceData);
      
      // Refresh assignments to ensure UI is synchronized with server data
      console.log('[useOptimizedAssignments] Refreshing assignments after update to ensure data consistency');
      await refetch();
      
      toast({
        title: t('planner.assignmentUpdated'),
        description: t('planner.assignmentUpdatedMsg', { title: data.title })
      });
      
      setOperationState(id, 'success');
      console.log('[useOptimizedAssignments] Update completed successfully with data refresh');
      
    } catch (error) {
      console.error('[useOptimizedAssignments] === UPDATE ERROR ===');
      console.error('[useOptimizedAssignments] Error details:', error);
      console.error('[useOptimizedAssignments] Error message:', error instanceof Error ? error.message : 'Unknown error');
      setOperationState(id, 'error');
      
      // Revert optimistic update on error
      await refetch();
      
      const errorMessage = error instanceof Error ? error.message : t('planner.errorUpdatingAssignment');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast, t, setOperationState, refetch, setAssignments, allEmployees, assignments]);

  const deleteAssignment = useCallback(async (id: string) => {
    setOperationState(id, 'loading');
    
    // Store original assignment in case we need to revert
    const originalAssignment = assignments.find(a => a.id === id);
    
    try {
      console.log('[useOptimizedAssignments] === DELETE ASSIGNMENT DEBUG ===');
      console.log('[useOptimizedAssignments] Deleting assignment:', id);
      
      // Optimistically remove from UI
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
      
      await OptimizedAssignmentService.deleteAssignment(id);
      
      toast({
        title: t('planner.assignmentDeleted'),
        description: t('planner.assignmentDeletedMsg')
      });
      
      setOperationState(id, 'success');
      console.log('[useOptimizedAssignments] Delete completed successfully - no refetch needed');
      
      // Clear cache to ensure fresh data on next fetch (without forcing refetch)
      OptimizedAssignmentService.clearCache();
      
    } catch (error) {
      console.error('[useOptimizedAssignments] === DELETE ERROR ===');
      console.error('[useOptimizedAssignments] Delete failed:', error);
      setOperationState(id, 'error');
      
      // Revert optimistic update by adding the assignment back
      if (originalAssignment) {
        setAssignments(prev => [...prev, originalAssignment].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
      }
      
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('planner.errorDeletingAssignment'),
        variant: "destructive"
      });
    }
  }, [toast, t, setOperationState, setAssignments, assignments]);

  const publishAssignment = useCallback(async (id: string) => {
    setOperationState(id, 'loading');
    try {
      console.log('[useOptimizedAssignments] Publishing assignment:', id);
      
      // Optimistically update the UI
      setAssignments(prev => prev.map(assignment => 
        assignment.id === id ? { ...assignment, published: true } : assignment
      ));
      
      await OptimizedAssignmentService.publishAssignment(id);
      
      toast({
        title: t('planner.assignmentPublished'),
        description: t('planner.assignmentPublishedMsg')
      });
      
      setOperationState(id, 'success');
      
      // Refetch to get updated data
      await refetch();
    } catch (error) {
      console.error('[useOptimizedAssignments] Publish failed:', error);
      setOperationState(id, 'error');
      
      // Revert optimistic update on error
      await refetch();
      
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('planner.errorPublishingAssignment'),
        variant: "destructive"
      });
    }
  }, [toast, t, setOperationState, refetch, setAssignments]);

  const publishAssignmentsByDate = useCallback(async (date: string) => {
    try {
      console.log('[useOptimizedAssignments] Publishing assignments by date:', date);
      
      // Optimistically update all assignments for the date
      setAssignments(prev => prev.map(assignment => 
        assignment.date === date ? { ...assignment, published: true } : assignment
      ));
      
      await OptimizedAssignmentService.publishAssignmentsByDate(date);
      
      toast({
        title: t('planner.dayPublished'),
        description: t('planner.dayPublishedMsg', { date })
      });
      
      // Refetch to get updated data
      await refetch();
    } catch (error) {
      console.error('[useOptimizedAssignments] Publish by date failed:', error);
      
      // Revert optimistic update on error
      await refetch();
      
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('planner.errorPublishingDay'),
        variant: "destructive"
      });
    }
  }, [toast, t, refetch, setAssignments]);

  useEffect(() => {
    if (authReady && isAuthenticated && user?.id && user?.role) {
      fetchAssignments();
    }
  }, [fetchAssignments, authReady, isAuthenticated, user?.id, user?.role]);

  return {
    assignments,
    loading,
    error,
    operationStates,
    refetch,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    publishAssignment,
    publishAssignmentsByDate,
    setAssignments
  };
};
