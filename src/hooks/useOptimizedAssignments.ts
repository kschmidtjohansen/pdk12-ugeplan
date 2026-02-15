import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { OptimizedAssignmentService, OptimizedAssignmentData } from '@/services/optimizedAssignmentService';
import { Assignment, normalizeEmployees } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { sanitizeUUIDForDB } from '@/utils/uuidValidation';
import { useEmployeeData } from '@/hooks/employee/useEmployeeData';
import { resolveEmployeeDisplayName } from '@/utils/people';
import { PlannerChangeLogger } from '@/services/plannerChangeLogger';
import { supabase } from '@/integrations/supabase/client';

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
const convertToAssignment = (data: OptimizedAssignmentData, allEmployees: Employee[] = []): Assignment => {
  // Convert assignment_employees to employee IDs array and preserve full employee data  
  const employees = data.assignment_employees?.map(emp => emp.user_id).filter(Boolean) || [];
  
  const assignedEmployees = data.assignment_employees?.map(emp => {
    const userId = emp.user_id;
    const profile = emp.profiles as any;
    const profileName = profile?.name || '';
    const profileEmail = profile?.email || '';
    
    // Use the resolveEmployeeDisplayName utility for consistent name resolution
    const displayName = resolveEmployeeDisplayName({
      id: userId,
      name: profileName,
      email: profileEmail
    }, allEmployees);
    
    return {
      id: userId,
      name: displayName,
      email: profileEmail
    };
  }).filter(emp => emp?.id) || [];
  
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
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    responsibleUser: data.responsible_user,
    case_number: data.case_number
  };
};

export const useOptimizedAssignments = (filter: FilterType = 'all'): UseOptimizedAssignmentsResult => {
  const { user, isAuthenticated, authReady } = useAuth();
  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();
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
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] User not authenticated or role not available, skipping fetch');
      setAssignments([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      if (import.meta.env.DEV) console.log(`[useOptimizedAssignments] Fetching assignments with filter: ${filter} for user: ${user.email} (${user.role})`);
      
      let result: OptimizedAssignmentData[];
      
      switch (filter) {
        case 'all':
          result = await OptimizedAssignmentService.fetchAllAssignments(user.role, user.email, selectedDepartmentId, selectedSubDepartmentId);
          break;
        case 'published':
          result = await OptimizedAssignmentService.fetchAllPublishedAssignments(user.email, selectedDepartmentId, selectedSubDepartmentId);
          break;
        case 'unpublished':
          result = await OptimizedAssignmentService.fetchUnpublishedAssignments(user.id, user.role, user.email, selectedDepartmentId, selectedSubDepartmentId);
          break;
        case 'user':
          result = await OptimizedAssignmentService.fetchUserAssignments(user.id, user.role, user.email, selectedDepartmentId, selectedSubDepartmentId);
          break;
        default:
          result = [];
      }

      // Convert OptimizedAssignmentData to Assignment format with enhanced error handling
      const convertedAssignments = result.map(data => {
        try {
          return convertToAssignment(data, allEmployees);
        } catch (conversionError) {
          console.error('[useOptimizedAssignments] Error converting assignment:', conversionError, data);
          // Return a safe fallback assignment
          return {
            id: data.id || 'unknown',
            title: data.title || 'Unknown Assignment',
            description: data.description || '',
            date: data.assignment_date || '',
            fromTime: data.from_time || '08:00',
            toTime: data.to_time || '16:00',
            location: data.location || '',
            type: data.type,
            published: data.published || false,
            responsibleUserId: data.responsible_user_id,
            employees: [],
            assignedEmployees: [],
            car: '',
            cars: [],
            createdAt: data.created_at || '',
            updatedAt: data.updated_at || '',
            responsibleUser: data.responsible_user
          };
        }
      });

      if (import.meta.env.DEV) console.log(`[useOptimizedAssignments] Successfully fetched ${convertedAssignments.length} assignments`);
      setAssignments(convertedAssignments);
    } catch (err) {
      console.error('[useOptimizedAssignments] Error fetching assignments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assignments';
      console.error('[useOptimizedAssignments] Detailed error:', {
        message: errorMessage,
        stack: err instanceof Error ? err.stack : null,
        userId: user?.id,
        userRole: user?.role,
        filter
      });
      setError(err instanceof Error ? err : new Error(errorMessage));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, user?.email, filter, allEmployees, selectedDepartmentId, selectedSubDepartmentId]);

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
      if (!data.fromTime) {
        throw new Error(t('planner.validation.fromTimeRequired'));
      }
      if (!data.toTime) {
        throw new Error(t('planner.validation.toTimeRequired'));
      }
      if (!data.location?.trim()) {
        throw new Error(t('planner.validation.locationRequired'));
      }

      // Check for multiple dates (multi-date creation)
      const dates = (data as any).dates?.length ? (data as any).dates : [data.date!];
      
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] CREATE - Detected dates:', dates);
      
      if (!dates || dates.length === 0 || !dates[0]) {
        throw new Error(t('planner.validation.dateRequired'));
      }

      // MULTI-DATE CREATION
      if (dates.length > 1) {
        if (import.meta.env.DEV) console.log('[useOptimizedAssignments] MULTI-DATE CREATE - Creating assignments for', dates.length, 'dates');
        
        const createdAssignments = [];
        const errors = [];
        
        // Build base service data (without assignment_date)
        const baseServiceData = {
          title: data.title.trim(),
          description: data.description?.trim() || null,
          from_time: data.fromTime,
          to_time: data.toTime,
          location: data.location.trim(),
          type: data.type || null,
          case_number: data.case_number || null,
          published: data.published || false,
          responsible_user_id: sanitizeUUIDForDB(data.responsibleUserId),
          car_id: sanitizeUUIDForDB(typeof data.car === 'string' ? data.car : null),
          car_ids: data.cars || null,
          employees: data.employees || [],
          department_id: selectedDepartmentId || null,
          sub_department_id: selectedSubDepartmentId || null,
        };
        
        // Create one assignment per date
        for (const date of dates) {
          try {
            if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Creating assignment for date:', date);
            const serviceData = { ...baseServiceData, assignment_date: date };
            const created = await OptimizedAssignmentService.createAssignment(serviceData, user.email);
            createdAssignments.push(created);
            
            // Log the creation
            await PlannerChangeLogger.logCreate(created.id, {
              title: serviceData.title,
              date: date,
              location: serviceData.location,
              fromTime: serviceData.from_time,
              toTime: serviceData.to_time,
              case_number: serviceData.case_number,
              employees: serviceData.employees,
              cars: serviceData.car_ids
            });
            
            if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Successfully created assignment for', date);
          } catch (err) {
            console.error('[useOptimizedAssignments] ❌ Failed to create assignment for', date, err);
            errors.push({ date, error: err });
          }
        }
        
        // Refresh data to show all created assignments
        await refetch();
        
        setOperationStates(prev => ({ ...prev, [operationId]: 'success' }));
        
        if (errors.length === 0) {
          toast({
            title: t('planner.assignmentCreated'),
            description: t('planner.assignmentsCreatedAcrossDays', { count: createdAssignments.length, days: dates.length }),
          });
        } else {
          toast({
            title: t('common.warning'),
            description: t('planner.assignmentsCreatedPartialFail', { 
              success: createdAssignments.length, 
              total: dates.length, 
              failed: errors.length 
            }),
            variant: 'destructive'
          });
        }
        
        if (import.meta.env.DEV) console.log('[useOptimizedAssignments] MULTI-DATE CREATE complete:', {
          success: createdAssignments.length,
          failed: errors.length
        });
        
        return;
      }

      // SINGLE-DATE CREATION (existing flow)
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] SINGLE-DATE CREATE for date:', dates[0]);
      
      const serviceData = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        assignment_date: dates[0],
        from_time: data.fromTime,
        to_time: data.toTime,
        location: data.location.trim(),
        type: data.type || null,
        case_number: data.case_number || null,
        published: data.published || false,
        responsible_user_id: sanitizeUUIDForDB(data.responsibleUserId),
        car_id: sanitizeUUIDForDB(typeof data.car === 'string' ? data.car : null),
        car_ids: data.cars || null,
        employees: data.employees || [],
        department_id: selectedDepartmentId || null,
        sub_department_id: selectedSubDepartmentId || null,
      };

      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Creating assignment with data:', serviceData);

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
      const createdAssignment = await OptimizedAssignmentService.createAssignment(serviceData, user.email);
      
      // Log the creation for single-date assignments
      try {
        await PlannerChangeLogger.logCreate(createdAssignment.id, {
          title: serviceData.title,
          date: serviceData.assignment_date,
          location: serviceData.location,
          fromTime: serviceData.from_time,
          toTime: serviceData.to_time,
          case_number: serviceData.case_number,
          employees: serviceData.employees,
          cars: serviceData.car_ids
        });
      } catch (logErr) {
        console.error('[useOptimizedAssignments] Failed to log creation:', logErr);
        // Continue even if logging fails
      }
      
      // Replace optimistic assignment with real one
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === optimisticAssignment.id 
            ? convertToAssignment(createdAssignment, allEmployees)
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
  }, [toast, t, setAssignments, setOperationStates, allEmployees, refetch]);

  const updateAssignment = useCallback(async (id: string, data: Partial<Assignment>) => {
    setOperationState(id, 'loading');
    try {
      if (import.meta.env.DEV) {
        console.log('[useOptimizedAssignments] UPDATE - Assignment ID:', id);
        console.log('[useOptimizedAssignments] UPDATE - Input data:', data);
      }
      
      // Enhanced data validation with detailed logging
      if (!data.title?.trim()) {
        throw new Error('Title is required and cannot be empty');
      }
      if (!data.location?.trim()) {
        throw new Error('Location is required and cannot be empty');
      }
      if (!data.fromTime) {
        throw new Error('Start time is required');
      }
      if (!data.toTime) {
        throw new Error('End time is required');
      }
      
      // Check for multiple dates (multi-date update)
      const dates = (data as any).dates?.length ? (data as any).dates : [data.date!];
      
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] UPDATE - Detected dates:', dates);
      
      if (!dates || dates.length === 0 || !dates[0]) {
        throw new Error('Date is required');
      }
      
      // Find original assignment for proper optimistic update
      const originalAssignment = assignments.find(a => a.id === id);
      
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Available employees for lookup:', allEmployees.length);
      
      // MULTI-DATE UPDATE
      if (dates.length > 1) {
        if (import.meta.env.DEV) console.log('[useOptimizedAssignments] MULTI-DATE UPDATE - Updating and creating', dates.length - 1, 'additional assignments');
        
        // Update the current assignment with the first date
        const firstDateServiceData = {
          title: data.title?.trim(),
          description: data.description?.trim() || null,
          assignment_date: dates[0],
          from_time: data.fromTime,
          to_time: data.toTime,
          location: data.location?.trim(),
          case_number: data.case_number || null,
          published: data.published || false,
          responsible_user_id: sanitizeUUIDForDB(data.responsibleUserId),
          car_id: sanitizeUUIDForDB(typeof data.car === 'string' ? data.car : (data.car as any)?.id || null),
          car_ids: Array.isArray(data.cars) ? data.cars.filter(Boolean) : 
                   (data.car ? [typeof data.car === 'string' ? data.car : (data.car as any)?.id] : null),
          employees: data.employees || []
        };
        
        if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Updating existing assignment with first date:', dates[0]);
        await OptimizedAssignmentService.updateAssignment(id, firstDateServiceData, user.email);
        
        // Log the update
        if (originalAssignment) {
          await PlannerChangeLogger.logUpdate(id, originalAssignment, {
            ...data,
            date: dates[0],
            case_number: data.case_number ?? originalAssignment.case_number
          });
        }
        
        // Create new assignments for remaining dates
        const createdAssignments = [];
        const errors = [];
        
        for (let i = 1; i < dates.length; i++) {
          try {
            if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Creating new assignment for date:', dates[i]);
            const newAssignmentData = {
              title: data.title?.trim(),
              description: data.description?.trim() || null,
              assignment_date: dates[i],
              from_time: data.fromTime,
              to_time: data.toTime,
              location: data.location?.trim(),
              type: data.type || null,
              case_number: data.case_number || null,
              published: data.published || false,
              responsible_user_id: sanitizeUUIDForDB(data.responsibleUserId),
              car_id: sanitizeUUIDForDB(typeof data.car === 'string' ? data.car : (data.car as any)?.id || null),
              car_ids: Array.isArray(data.cars) ? data.cars.filter(Boolean) : 
                       (data.car ? [typeof data.car === 'string' ? data.car : (data.car as any)?.id] : null),
              employees: data.employees || []
            };
            const created = await OptimizedAssignmentService.createAssignment(newAssignmentData, user.email);
            createdAssignments.push(created);
            
            // Log the creation
            await PlannerChangeLogger.logCreate(created.id, {
              title: newAssignmentData.title,
              date: dates[i],
              location: newAssignmentData.location,
              fromTime: newAssignmentData.from_time,
              toTime: newAssignmentData.to_time,
              case_number: newAssignmentData.case_number,
              employees: newAssignmentData.employees,
              cars: newAssignmentData.car_ids
            });
            
            if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Successfully created assignment for', dates[i]);
          } catch (err) {
            console.error('[useOptimizedAssignments] ❌ Failed to create assignment for', dates[i], err);
            errors.push({ date: dates[i], error: err });
          }
        }
        
        // Refresh data to show all updated/created assignments
        await refetch();
        
        setOperationState(id, 'success');
        
        if (errors.length === 0) {
          toast({
            title: t('planner.assignmentUpdated'),
            description: t('planner.assignmentsUpdatedAcrossDays', { days: dates.length }),
          });
        } else {
          toast({
            title: t('common.warning'),
            description: t('planner.assignmentsUpdatedPartialFail', { 
              success: createdAssignments.length, 
              total: dates.length - 1, 
              failed: errors.length 
            }),
            variant: 'destructive'
          });
        }
        
        if (import.meta.env.DEV) console.log('[useOptimizedAssignments] MULTI-DATE UPDATE complete:', {
          updated: 1,
          created: createdAssignments.length,
          failed: errors.length
        });
        
        return;
      }
      
      // SINGLE-DATE UPDATE (existing flow)
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] SINGLE-DATE UPDATE for date:', dates[0]);
      
      // Optimistically update the UI with proper employee and car data reconstruction
      setAssignments(prev => prev.map(assignment => {
        if (assignment.id === id) {
          const updatedAssignment = { ...assignment, ...data };
          
          // EMPLOYEE UPDATE FIX: Properly reconstruct assignedEmployees when employee IDs change
          if (data.employees !== undefined) {
            if (import.meta.env.DEV) console.log('[useOptimizedAssignments] EMPLOYEE UPDATE - New employee IDs:', data.employees);
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
            
            if (import.meta.env.DEV) console.log('[useOptimizedAssignments] EMPLOYEE UPDATE - Reconstructed assignedEmployees:', updatedAssignment.assignedEmployees);
          }
          
          // CAR UPDATE FIX: Properly handle car updates 
          if (data.car !== undefined) {
            if (import.meta.env.DEV) console.log('[useOptimizedAssignments] CAR UPDATE - New car:', data.car);
            // Extract string ID from car data (handle both string and object)
            const carId = typeof data.car === 'string' ? data.car : (data.car as any)?.id || '';
            updatedAssignment.car = carId;
            // If car is set, ensure it's also in the cars array
            if (carId) {
              updatedAssignment.cars = [carId];
            } else {
              updatedAssignment.cars = [];
            }
            if (import.meta.env.DEV) console.log('[useOptimizedAssignments] CAR UPDATE - Updated car data:', {
              car: updatedAssignment.car,
              cars: updatedAssignment.cars
            });
          }
          
          // Handle multiple cars update
          if (data.cars !== undefined) {
            if (import.meta.env.DEV) console.log('[useOptimizedAssignments] CARS UPDATE - New cars array:', data.cars);
            updatedAssignment.cars = data.cars;
            // Set the first car as the primary car
            updatedAssignment.car = data.cars.length > 0 ? data.cars[0] : '';
            if (import.meta.env.DEV) console.log('[useOptimizedAssignments] CARS UPDATE - Updated car data:', {
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
        assignment_date: dates[0],
        from_time: data.fromTime,
        to_time: data.toTime,
        location: data.location?.trim(),
        case_number: data.case_number || null,
        published: data.published || false,
        responsible_user_id: sanitizeUUIDForDB(data.responsibleUserId),
        car_id: sanitizeUUIDForDB(typeof data.car === 'string' ? data.car : (data.car as any)?.id || null),
        car_ids: Array.isArray(data.cars) ? data.cars.filter(Boolean) : 
                 (data.car ? [typeof data.car === 'string' ? data.car : (data.car as any)?.id] : null),
        employees: data.employees || [] // Include employee IDs for updates
      };
      
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Service data:', serviceData);
      
      await OptimizedAssignmentService.updateAssignment(id, serviceData, user.email);
      
      // Log the update
      if (originalAssignment) {
        await PlannerChangeLogger.logUpdate(id, originalAssignment, {
          ...data,
          date: dates[0],
          case_number: data.case_number ?? originalAssignment.case_number
        });
      } else {
        // Fallback: fetch the before state from Supabase if not in local state
        if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Original assignment not found in state, fetching from DB for logging');
        try {
          const { data: beforeData, error: fetchError } = await supabase
            .from('assignments')
            .select('*, assignment_employees(user_id, profiles(name, email))')
            .eq('id', id)
            .single();
          
          if (!fetchError && beforeData) {
            const beforeAssignment = convertToAssignment(beforeData as any, allEmployees);
            await PlannerChangeLogger.logUpdate(id, beforeAssignment, {
              ...data,
              date: dates[0],
              case_number: data.case_number ?? beforeAssignment.case_number
            });
          }
        } catch (fetchErr) {
          console.error('[useOptimizedAssignments] Failed to fetch before state for logging:', fetchErr);
        }
      }
      
      // Refresh assignments to ensure UI is synchronized with server data
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Refreshing assignments after update');
      await refetch();
      
      toast({
        title: t('planner.assignmentUpdated'),
        description: t('planner.assignmentUpdatedMsg', { title: data.title })
      });
      
      setOperationState(id, 'success');
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Update completed successfully');
      
    } catch (error) {
      console.error('[useOptimizedAssignments] Update error:', error);
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
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Deleting assignment:', id);
      
      // Optimistically remove from UI
      setAssignments(prev => prev.filter(assignment => assignment.id !== id));
      
      // Service now handles deletion logging internally
      await OptimizedAssignmentService.deleteAssignment(id, user.email);
      
      // Show case number in toast if available
      const caseNumber = originalAssignment?.case_number || originalAssignment?.title;
      const description = originalAssignment?.case_number 
        ? t('planner.assignmentDeletedMsgWithCase', { caseNumber })
        : t('planner.assignmentDeletedMsg');
      
      toast({
        title: t('planner.assignmentDeleted'),
        description
      });
      
      setOperationState(id, 'success');
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Delete completed successfully');
      
      // Clear cache to ensure fresh data on next fetch (without forcing refetch)
      OptimizedAssignmentService.clearCache();
      
    } catch (error) {
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
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Publishing assignment:', id);
      
      // Optimistically update the UI
      setAssignments(prev => prev.map(assignment => 
        assignment.id === id ? { ...assignment, published: true } : assignment
      ));
      
      await OptimizedAssignmentService.publishAssignment(id, user.email);
      
      // Log the publish operation
      await PlannerChangeLogger.logPublish([id]);
      
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
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Publishing assignments by date:', date);
      
      // Get assignments to publish before the update
      const assignmentsToPublish = assignments.filter(
        assignment => assignment.date === date && !assignment.published
      );
      const assignmentIds = assignmentsToPublish.map(a => a.id);
      
      // Optimistically update all assignments for the date
      setAssignments(prev => prev.map(assignment => 
        assignment.date === date ? { ...assignment, published: true } : assignment
      ));
      
      await OptimizedAssignmentService.publishAssignmentsByDate(date, user.email);
      
      // Log the bulk publish operation
      if (assignmentIds.length > 0) {
        await PlannerChangeLogger.logPublish(assignmentIds);
      }
      
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

  // Realtime subscription for assignments table
  useEffect(() => {
    if (user?.email === 'test@polygongroup.com' || !isAuthenticated || !user?.id) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const channel = supabase
      .channel('optimized-assignments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        if (!isMounted) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (isMounted) {
            console.log('[useOptimizedAssignments] Realtime change detected, refetching...');
            refetch().catch(err => console.error('[useOptimizedAssignments] Realtime refetch error:', err));
          }
        }, 1000);
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[useOptimizedAssignments] Realtime channel error, falling back to existing data');
        }
      });

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id, user?.email, refetch]);

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
