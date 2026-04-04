import { useState, useCallback } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

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
  deleteAssignmentsByGroupId: (groupId: string) => Promise<void>;
  detachFromGroup: (id: string) => Promise<boolean>;
  publishAssignment: (id: string) => Promise<void>;
  publishAssignmentsByDate: (date: string) => Promise<void>;
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
}

// Helper function to convert OptimizedAssignmentData to Assignment
const convertToAssignment = (data: OptimizedAssignmentData, allEmployees: Employee[] = []): Assignment => {
  const employees = data.assignment_employees?.map(emp => emp.user_id).filter(Boolean) || [];
  
  const assignedEmployees = data.assignment_employees?.map(emp => {
    const userId = emp.user_id;
    const profile = emp.profiles as any;
    const profileName = profile?.name || '';
    const profileEmail = profile?.email || '';
    
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
  
  let cars: string[] = [];
  let firstCar = '';
  
  if (data.assignment_cars && data.assignment_cars.length > 0) {
    cars = data.assignment_cars.map(car => car.id);
    firstCar = cars[0] || '';
  } else if (data.car_ids && Array.isArray(data.car_ids) && data.car_ids.length > 0) {
    cars = data.car_ids;
    firstCar = cars[0] || '';
  } else if (data.car_id) {
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
  const queryClient = useQueryClient();
  const [operationStates, setOperationStates] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
  
  // Local override state for optimistic updates
  const [localAssignments, setLocalAssignments] = useState<Assignment[] | null>(null);

  const setOperationState = useCallback((id: string, state: 'idle' | 'loading' | 'success' | 'error') => {
    setOperationStates(prev => ({ ...prev, [id]: state }));
  }, []);

  const queryKey = ['assignments', user?.id, user?.role, filter, selectedDepartmentId, selectedSubDepartmentId];

  const fetchAssignmentsFn = async (): Promise<Assignment[]> => {
    if (!user?.id || !user?.role) {
      return [];
    }

    if (import.meta.env.DEV) console.log(`[useOptimizedAssignments] Fetching assignments with filter: ${filter}`);

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

    const convertedAssignments = result.map(data => {
      try {
        return convertToAssignment(data, allEmployees);
      } catch (conversionError) {
        if (import.meta.env.DEV) console.error('[useOptimizedAssignments] Error converting assignment:', conversionError);
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

    if (import.meta.env.DEV) console.log(`[useOptimizedAssignments] Fetched ${convertedAssignments.length} assignments`);
    return convertedAssignments;
  };

  const { data: queryData, isLoading, error: queryError, refetch: queryRefetch } = useQuery({
    queryKey,
    queryFn: fetchAssignmentsFn,
    enabled: authReady && isAuthenticated && !!user?.id && !!user?.role && (user?.email === 'test@polygongroup.com' || !!selectedDepartmentId),
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000, // 10 min
  });

  // Use local override if set, otherwise use query data
  const assignments = localAssignments ?? queryData ?? [];

  // Clear local override when query data updates (from server)
  const prevQueryDataRef = useRef(queryData);
  useEffect(() => {
    if (queryData !== prevQueryDataRef.current) {
      prevQueryDataRef.current = queryData;
      setLocalAssignments(null);
    }
  }, [queryData]);

  // setAssignments sets local override for optimistic UI
  const setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>> = useCallback((action) => {
    setLocalAssignments(prev => {
      const current = prev ?? queryData ?? [];
      return typeof action === 'function' ? action(current) : action;
    });
  }, [queryData]);

  const refetch = useCallback(async () => {
    OptimizedAssignmentService.clearCache();
    setLocalAssignments(null);
    await queryRefetch();
  }, [queryRefetch]);

  // Realtime subscription for assignments + assignments_employees tables
  useEffect(() => {
    if (user?.email === 'test@polygongroup.com' || !isAuthenticated || !user?.id) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const handleRealtimeChange = () => {
      if (!isMounted) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (isMounted) {
          if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Realtime change detected, invalidating...');
          OptimizedAssignmentService.clearCache();
          queryClient.invalidateQueries({ queryKey: ['assignments'] });
        }
      }, 1000);
    };

    const channel = supabase
      .channel('optimized-assignments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments_employees' }, handleRealtimeChange)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          if (import.meta.env.DEV) console.warn('[useOptimizedAssignments] Realtime channel error');
        }
      });

    return () => {
      isMounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id, user?.email, queryClient]);

  const createAssignment = useCallback(async (data: Partial<Assignment>) => {
    const operationId = `create-${Date.now()}`;
    
    try {
      setOperationStates(prev => ({ ...prev, [operationId]: 'loading' }));

      // LAG 3: Guard mod oprettelse uden department_id (forhindrer cross-tenant lækage)
      if (!selectedDepartmentId && user?.email !== 'test@polygongroup.com') {
        throw new Error('Afdeling er ikke klar endnu. Vent et øjeblik og prøv igen.');
      }
      
      if (!data.title?.trim()) throw new Error(t('planner.validation.titleRequired'));
      if (!data.fromTime) throw new Error(t('planner.validation.fromTimeRequired'));
      if (!data.toTime) throw new Error(t('planner.validation.toTimeRequired'));
      if (!data.location?.trim()) throw new Error(t('planner.validation.locationRequired'));

      const dates = (data as any).dates?.length ? (data as any).dates : [data.date!];
      
      if (!dates || dates.length === 0 || !dates[0]) throw new Error(t('planner.validation.dateRequired'));

      // MULTI-DATE CREATION
      if (dates.length > 1) {
        if (import.meta.env.DEV) console.log('[useOptimizedAssignments] MULTI-DATE CREATE for', dates.length, 'dates');
        
        const createdAssignments = [];
        const errors = [];
        
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
        
        for (const date of dates) {
          try {
            const serviceData = { ...baseServiceData, assignment_date: date };
            const created = await OptimizedAssignmentService.createAssignment(serviceData, user.email);
            createdAssignments.push(created);
            await PlannerChangeLogger.logCreate(created.id, {
              title: serviceData.title, date, location: serviceData.location,
              fromTime: serviceData.from_time, toTime: serviceData.to_time,
              case_number: serviceData.case_number, employees: serviceData.employees, cars: serviceData.car_ids
            });
          } catch (err) {
            if (import.meta.env.DEV) console.error('[useOptimizedAssignments] Failed to create for', date, err);
            errors.push({ date, error: err });
          }
        }
        
        await refetch();
        setOperationStates(prev => ({ ...prev, [operationId]: 'success' }));
        
        toast({
          title: t('planner.assignmentCreated'),
          description: errors.length === 0
            ? t('planner.assignmentsCreatedAcrossDays', { count: createdAssignments.length, days: dates.length })
            : t('planner.assignmentsCreatedPartialFail', { success: createdAssignments.length, total: dates.length, failed: errors.length }),
          ...(errors.length > 0 && { variant: 'destructive' as const })
        });
        return;
      }

      // SINGLE-DATE CREATION
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

      // Optimistic assignment
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

      setAssignments(prev => [optimisticAssignment, ...prev]);

      const createdAssignment = await OptimizedAssignmentService.createAssignment(serviceData, user.email);
      
      try {
        await PlannerChangeLogger.logCreate(createdAssignment.id, {
          title: serviceData.title, date: serviceData.assignment_date, location: serviceData.location,
          fromTime: serviceData.from_time, toTime: serviceData.to_time,
          case_number: serviceData.case_number, employees: serviceData.employees, cars: serviceData.car_ids
        });
      } catch (logErr) {
        if (import.meta.env.DEV) console.error('[useOptimizedAssignments] Failed to log creation:', logErr);
      }
      
      // Replace optimistic with real
      setAssignments(prev => 
        prev.map(a => a.id === optimisticAssignment.id ? convertToAssignment(createdAssignment, allEmployees) : a)
      );

      setOperationStates(prev => ({ ...prev, [operationId]: 'success' }));
      toast({ title: t('planner.assignmentCreated'), description: t('planner.assignmentCreatedMsg', { title: serviceData.title }) });

    } catch (error) {
      if (import.meta.env.DEV) console.error('[useOptimizedAssignments] Create error:', error);
      setAssignments(prev => prev.filter(a => !a.id.startsWith('temp-')));
      setOperationStates(prev => ({ ...prev, [operationId]: 'error' }));
      toast({ variant: 'destructive', title: t('common.error'), description: error instanceof Error ? error.message : t('common.error') });
      throw error;
    }
  }, [toast, t, setAssignments, setOperationStates, allEmployees, refetch, user, selectedDepartmentId, selectedSubDepartmentId]);

  const updateAssignment = useCallback(async (id: string, data: Partial<Assignment>) => {
    setOperationState(id, 'loading');
    try {
      if (!data.title?.trim()) throw new Error('Title is required');
      if (!data.location?.trim()) throw new Error('Location is required');
      if (!data.fromTime) throw new Error('Start time is required');
      if (!data.toTime) throw new Error('End time is required');
      
      const dates = (data as any).dates?.length ? (data as any).dates : [data.date!];
      if (!dates || dates.length === 0 || !dates[0]) throw new Error('Date is required');
      
      const originalAssignment = assignments.find(a => a.id === id);
      
      // MULTI-DATE UPDATE
      if (dates.length > 1) {
        if (import.meta.env.DEV) console.log('[useOptimizedAssignments] MULTI-DATE UPDATE for', dates.length, 'dates');
        
        const firstDateServiceData = {
          title: data.title?.trim(), description: data.description?.trim() || null,
          assignment_date: dates[0], from_time: data.fromTime, to_time: data.toTime,
          location: data.location?.trim(), case_number: data.case_number || null,
          published: data.published || false,
          responsible_user_id: sanitizeUUIDForDB(data.responsibleUserId),
          car_id: sanitizeUUIDForDB(typeof data.car === 'string' ? data.car : (data.car as any)?.id || null),
          car_ids: Array.isArray(data.cars) ? data.cars.filter(Boolean) : (data.car ? [typeof data.car === 'string' ? data.car : (data.car as any)?.id] : null),
          employees: data.employees || []
        };
        
        await OptimizedAssignmentService.updateAssignment(id, firstDateServiceData, user.email);
        if (originalAssignment) {
          await PlannerChangeLogger.logUpdate(id, originalAssignment, { ...data, date: dates[0], case_number: data.case_number ?? originalAssignment.case_number });
        }
        
        const errors = [];
        for (let i = 1; i < dates.length; i++) {
          try {
            const newData = { ...firstDateServiceData, assignment_date: dates[i], type: data.type || null };
            const created = await OptimizedAssignmentService.createAssignment(newData, user.email);
            await PlannerChangeLogger.logCreate(created.id, { title: newData.title, date: dates[i], location: newData.location, fromTime: newData.from_time, toTime: newData.to_time, case_number: newData.case_number, employees: newData.employees, cars: newData.car_ids });
          } catch (err) {
            if (import.meta.env.DEV) console.error('[useOptimizedAssignments] Failed for', dates[i], err);
            errors.push({ date: dates[i], error: err });
          }
        }
        
        await refetch();
        setOperationState(id, 'success');
        toast({
          title: t('planner.assignmentUpdated'),
          description: errors.length === 0
            ? t('planner.assignmentsUpdatedAcrossDays', { days: dates.length })
            : t('planner.assignmentsUpdatedPartialFail', { success: dates.length - 1 - errors.length, total: dates.length - 1, failed: errors.length }),
          ...(errors.length > 0 && { variant: 'destructive' as const })
        });
        return;
      }
      
      // SINGLE-DATE UPDATE - Optimistic UI
      setAssignments(prev => prev.map(assignment => {
        if (assignment.id === id) {
          const updatedAssignment = { ...assignment, ...data };
          
          if (data.employees !== undefined) {
            updatedAssignment.employees = data.employees;
            updatedAssignment.assignedEmployees = data.employees.map(employeeId => {
              const employee = allEmployees.find(emp => emp.id === employeeId);
              if (employee) return { id: employee.id, name: employee.name, email: employee.email };
              const existing = originalAssignment?.assignedEmployees?.find(emp => emp.id === employeeId);
              return existing || { id: employeeId, name: `Employee ${employeeId}`, email: '' };
            }).filter(Boolean);
          }
          
          if (data.car !== undefined) {
            const carId = typeof data.car === 'string' ? data.car : (data.car as any)?.id || '';
            updatedAssignment.car = carId;
            updatedAssignment.cars = carId ? [carId] : [];
          }
          
          if (data.cars !== undefined) {
            updatedAssignment.cars = data.cars;
            updatedAssignment.car = data.cars.length > 0 ? data.cars[0] : '';
          }
          
          return updatedAssignment;
        }
        return assignment;
      }));
      
      const serviceData = {
        title: data.title?.trim(), description: data.description?.trim() || null,
        assignment_date: dates[0], from_time: data.fromTime, to_time: data.toTime,
        location: data.location?.trim(), case_number: data.case_number || null,
        published: data.published || false,
        responsible_user_id: sanitizeUUIDForDB(data.responsibleUserId),
        car_id: sanitizeUUIDForDB(typeof data.car === 'string' ? data.car : (data.car as any)?.id || null),
        car_ids: Array.isArray(data.cars) ? data.cars.filter(Boolean) : (data.car ? [typeof data.car === 'string' ? data.car : (data.car as any)?.id] : null),
        employees: data.employees || []
      };
      
      await OptimizedAssignmentService.updateAssignment(id, serviceData, user.email);
      
      if (originalAssignment) {
        await PlannerChangeLogger.logUpdate(id, originalAssignment, { ...data, date: dates[0], case_number: data.case_number ?? originalAssignment.case_number });
      }
      
      await refetch();
      toast({ title: t('planner.assignmentUpdated'), description: t('planner.assignmentUpdatedMsg', { title: data.title }) });
      setOperationState(id, 'success');
      
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useOptimizedAssignments] Update error:', error);
      setOperationState(id, 'error');
      await refetch();
      toast({ title: t('common.error'), description: error instanceof Error ? error.message : t('planner.errorUpdatingAssignment'), variant: "destructive" });
    }
  }, [toast, t, setOperationState, refetch, setAssignments, allEmployees, assignments, user]);

  const deleteAssignment = useCallback(async (id: string) => {
    setOperationState(id, 'loading');
    const originalAssignment = assignments.find(a => a.id === id);
    
    try {
      setAssignments(prev => prev.filter(a => a.id !== id));
      await OptimizedAssignmentService.deleteAssignment(id, user.email);
      
      const caseNumber = originalAssignment?.case_number || originalAssignment?.title;
      toast({
        title: t('planner.assignmentDeleted'),
        description: originalAssignment?.case_number ? t('planner.assignmentDeletedMsgWithCase', { caseNumber }) : t('planner.assignmentDeletedMsg')
      });
      
      setOperationState(id, 'success');
      OptimizedAssignmentService.clearCache();
      
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useOptimizedAssignments] Delete failed:', error);
      setOperationState(id, 'error');
      if (originalAssignment) {
        setAssignments(prev => [...prev, originalAssignment].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }
      toast({ title: t('common.error'), description: error instanceof Error ? error.message : t('planner.errorDeletingAssignment'), variant: "destructive" });
    }
  }, [toast, t, setOperationState, setAssignments, assignments, user]);

  const publishAssignment = useCallback(async (id: string) => {
    setOperationState(id, 'loading');
    try {
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, published: true } : a));
      await OptimizedAssignmentService.publishAssignment(id, user.email);
      await PlannerChangeLogger.logPublish([id]);
      toast({ title: t('planner.assignmentPublished'), description: t('planner.assignmentPublishedMsg') });
      setOperationState(id, 'success');
      await refetch();
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useOptimizedAssignments] Publish failed:', error);
      setOperationState(id, 'error');
      await refetch();
      toast({ title: t('common.error'), description: error instanceof Error ? error.message : t('planner.errorPublishingAssignment'), variant: "destructive" });
    }
  }, [toast, t, setOperationState, refetch, setAssignments, user]);

  const publishAssignmentsByDate = useCallback(async (date: string) => {
    try {
      const assignmentIds = assignments.filter(a => a.date === date && !a.published).map(a => a.id);
      setAssignments(prev => prev.map(a => a.date === date ? { ...a, published: true } : a));
      await OptimizedAssignmentService.publishAssignmentsByDate(date, user.email);
      if (assignmentIds.length > 0) await PlannerChangeLogger.logPublish(assignmentIds);
      toast({ title: t('planner.dayPublished'), description: t('planner.dayPublishedMsg', { date }) });
      await refetch();
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useOptimizedAssignments] Publish by date failed:', error);
      await refetch();
      toast({ title: t('common.error'), description: error instanceof Error ? error.message : t('planner.errorPublishingDay'), variant: "destructive" });
    }
  }, [toast, t, refetch, setAssignments, assignments, user]);

  // Delete all assignments sharing a group_id
  const deleteAssignmentsByGroupId = useCallback(async (groupId: string) => {
    try {
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Deleting series with group_id:', groupId);

      // Optimistic: remove all matching assignments
      const idsToRemove = assignments.filter(a => a.groupId === groupId).map(a => a.id);
      setAssignments(prev => prev.filter(a => a.groupId !== groupId));

      // Delete employee links for each assignment
      for (const assignmentId of idsToRemove) {
        await supabase.from('assignments_employees').delete().eq('assignment_id', assignmentId);
      }

      // Delete all assignments in the group
      const { error } = await supabase.from('assignments').delete().eq('group_id', groupId);
      if (error) throw error;

      toast({
        title: t('planner.assignmentDeleted'),
        description: t('planner.series.seriesDeleted'),
      });

      OptimizedAssignmentService.clearCache();
      await refetch();
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useOptimizedAssignments] Series delete failed:', error);
      await refetch();
      toast({ title: t('common.error'), description: t('planner.errorDeletingAssignment'), variant: "destructive" });
    }
  }, [toast, t, refetch, setAssignments, assignments]);

  // Detach a single assignment from its group
  const detachFromGroup = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (import.meta.env.DEV) console.log('[useOptimizedAssignments] Detaching from group:', id);

      const { error } = await supabase
        .from('assignments')
        .update({ group_id: null, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, groupId: undefined } : a));
      OptimizedAssignmentService.clearCache();
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useOptimizedAssignments] Detach failed:', error);
      return false;
    }
  }, [setAssignments]);

  return {
    assignments,
    loading: isLoading,
    error: queryError,
    operationStates,
    refetch,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    deleteAssignmentsByGroupId,
    detachFromGroup,
    publishAssignment,
    publishAssignmentsByDate,
    setAssignments
  };
};
