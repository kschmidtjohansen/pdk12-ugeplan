import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { Assignment } from '@/types/assignment';
import { sanitizeUUIDForDB } from '@/utils/uuidValidation';
// DemoUserService removed — demo writes now go to DB with is_demo=true
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';
import { isDemoNonHomeDepartment } from '@/constants/demo';

export interface OptimizedAssignmentData {
  id: string;
  title: string;
  description: string | null;
  assignment_date: string;
  from_time: string;
  to_time: string;
  location: string;
  type: string | null;
  published: boolean;
  responsible_user_id: string | null;
  created_at: string;
  updated_at: string;
  car_id: string | null;
  car_ids: string[] | null;
  case_number: string | null;
  responsible_user: {
    id: string;
    name: string;
  } | null;
  assignment_employees: {
    user_id: string;
    profiles: {
      id: string;
      name: string;
    }
  }[];
  assignment_cars: {
    id: string;
    name: string;
  }[];
}

const cache = new Map<string, OptimizedAssignmentData[]>();

const getCacheKey = (userId: string, role: string, filter: string): string => {
  return `${userId}-${role}-${filter}`;
};

const isCacheValid = (cacheKey: string, duration: number = 30000): boolean => {
  const cachedData = cache.get(cacheKey);
  if (!cachedData) return false;
  const { timestamp } = (cachedData as any).metadata || {};
  if (!timestamp) return false;
  return (Date.now() - timestamp) < duration;
};

const setCache = (cacheKey: string, data: OptimizedAssignmentData[]): void => {
  cache.set(cacheKey, { data, metadata: { timestamp: Date.now() } } as any);
};

const getFromCache = (cacheKey: string): OptimizedAssignmentData[] | undefined => {
  const cachedData = cache.get(cacheKey);
  if (cachedData && isCacheValid(cacheKey)) {
    if (import.meta.env.DEV) console.log(`[OptimizedAssignmentService] Cache hit: ${cacheKey}`);
    return (cachedData as any).data;
  }
  return undefined;
};

export class OptimizedAssignmentService {
  static clearCache(): void {
    cache.clear();
    if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Cache cleared');
  }

  private static convertDemoAssignments(data: any[]): OptimizedAssignmentData[] {
    return data.map((assignment: any) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      assignment_date: assignment.assignment_date,
      from_time: assignment.from_time,
      to_time: assignment.to_time,
      location: assignment.location,
      type: assignment.type,
      published: assignment.published,
      responsible_user_id: assignment.responsible_user_id,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
      car_id: assignment.car_id,
      car_ids: assignment.car_ids || [],
      case_number: assignment.case_number || null,
      responsible_user: assignment.responsible_user ? {
        id: assignment.responsible_user.id,
        name: assignment.responsible_user.name
      } : null,
      assignment_employees: Array.isArray(assignment.team) ? assignment.team.map((member: any) => ({
        user_id: member.id,
        profiles: { id: member.id, name: member.name || '', email: member.email || '' }
      })) : [],
      assignment_cars: []
    }));
  }

  private static convertStoredDemoToOptimized(demo: any): OptimizedAssignmentData {
    return {
      id: demo.id,
      title: demo.title,
      description: demo.description,
      assignment_date: demo.assignment_date,
      from_time: demo.from_time,
      to_time: demo.to_time,
      location: demo.location,
      type: demo.type,
      published: demo.published || false,
      responsible_user_id: demo.responsible_user_id,
      created_at: demo.created_at,
      updated_at: demo.updated_at,
      car_id: demo.car_id || null,
      car_ids: demo.car_ids || [],
      case_number: demo.case_number || null,
      responsible_user: demo.responsible_user || null,
      assignment_employees: Array.isArray(demo.employees) ? demo.employees.map((empId: string) => ({
        user_id: empId,
        profiles: { id: empId, name: '' }
      })) : [],
      assignment_cars: []
    };
  }

  private static async fetchAssignmentEmployees(assignmentIds: string[]) {
    if (assignmentIds.length === 0) return [];
    
    try {
      const { data: assignmentEmployeeData, error: employeeError } = await supabase
        .from('assignments_employees')
        .select('assignment_id, user_id')
        .in('assignment_id', assignmentIds);

      if (employeeError) {
        if (import.meta.env.DEV) console.warn('[OptimizedAssignmentService] Assignment employees fetch error:', employeeError);
        return [];
      }

      if (!assignmentEmployeeData || assignmentEmployeeData.length === 0) {
        return [];
      }

      const userIds = [...new Set(assignmentEmployeeData.map(emp => emp.user_id))];
      
      let profilesData: any[] = [];
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        if (!profilesError && profiles) {
          profilesData = profiles;
          break;
        }
        
        if (import.meta.env.DEV) console.warn(`[OptimizedAssignmentService] Profiles fetch error (attempt ${retryCount + 1}):`, profilesError);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] CRITICAL: Failed to fetch profiles after all retries.');
          return assignmentEmployeeData.map(emp => ({
            assignment_id: emp.assignment_id,
            user_id: emp.user_id,
            profiles: { id: emp.user_id, name: '', email: '' }
          }));
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }

      return assignmentEmployeeData.map(emp => {
        const profile = profilesData.find(profile => profile.id === emp.user_id);
        
        if (!profile) {
          if (import.meta.env.DEV) console.warn(`[OptimizedAssignmentService] Profile not found for user ID: ${emp.user_id}`);
          return {
            assignment_id: emp.assignment_id,
            user_id: emp.user_id,
            profiles: { id: emp.user_id, name: '', email: '' }
          };
        }
        
        return {
          assignment_id: emp.assignment_id,
          user_id: emp.user_id,
          profiles: { 
            id: profile.id, 
            name: profile.name || '', 
            email: profile.email || '' 
          }
        };
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Error fetching assignment employees:', error);
      return [];
    }
  }

  private static async fetchAssignmentCars(carIds: string[]) {
    if (carIds.length === 0) return [];
    
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, name')
        .in('id', carIds);

      if (error) {
        if (import.meta.env.DEV) console.warn('[OptimizedAssignmentService] Cars fetch error:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Error fetching cars:', error);
      return [];
    }
  }

  private static async enrichAssignmentData(assignments: any[]): Promise<OptimizedAssignmentData[]> {
    const assignmentIds = assignments.map(a => a.id);
    
    const employeesData = await this.fetchAssignmentEmployees(assignmentIds);
    
    const allCarIds = new Set<string>();
    assignments.forEach(assignment => {
      if (assignment.car_id) allCarIds.add(assignment.car_id);
      if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
        assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
      }
    });
    
    const carsData = await this.fetchAssignmentCars(Array.from(allCarIds));
    
    return assignments.map(assignment => {
      const assignmentEmployees = employeesData
        .filter(emp => emp.assignment_id === assignment.id)
        .map(emp => ({ user_id: emp.user_id, profiles: emp.profiles }));
      
      let assignmentCars: { id: string; name: string; }[] = [];
      
      if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
        assignmentCars = assignment.car_ids
          .map((carId: string) => carsData.find(car => car.id === carId))
          .filter(Boolean)
          .map((car: any) => ({ id: car.id, name: car.name }));
      } else if (assignment.car_id) {
        const car = carsData.find(car => car.id === assignment.car_id);
        if (car) assignmentCars = [{ id: car.id, name: car.name }];
      }
      
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        assignment_date: assignment.assignment_date,
        from_time: assignment.from_time,
        to_time: assignment.to_time,
        location: assignment.location,
        type: assignment.type,
        published: assignment.published,
        responsible_user_id: assignment.responsible_user_id,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        car_id: assignment.car_id,
        car_ids: assignment.car_ids,
        case_number: assignment.case_number || null,
        responsible_user: null,
        assignment_employees: assignmentEmployees,
        assignment_cars: assignmentCars
      };
    });
  }

  static async fetchAllAssignments(role: string, userEmail?: string, departmentId?: string | null, subDepartmentId?: string | null): Promise<OptimizedAssignmentData[]> {
    try {
      const isDemoMode = userEmail === 'test@polygongroup.com' || sessionStorage.getItem('demo-mode') === 'true';
      
      if (isDemoMode) {
        if (isDemoNonHomeDepartment(true, departmentId)) {
          if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Non-home department in demo mode, returning empty');
          return [];
        }

        if (import.meta.env.DEV) console.log(`[OptimizedAssignmentService] DEMO MODE: Fetching demo assignments`);
        const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
        
        if (error) {
          if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Demo RPC error:', error);
          return [];
        }
        
        if (!data) return [];
        
        if (import.meta.env.DEV) console.log(`[OptimizedAssignmentService] Demo RPC returned ${data.length} assignments`);
        
        // RLS ensures demo user sees is_demo=true data — no local merge needed
        return this.convertDemoAssignments(data);
      }
      
      if (import.meta.env.DEV) console.log(`[OptimizedAssignmentService] Fetching assignments, role: ${role}`);

      try {
        const { data, error } = await supabase.rpc('list_accessible_assignments_with_team', {
          p_department_id: departmentId || null,
          p_sub_department_id: subDepartmentId || null
        });

        if (error) {
          if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] RPC error:', error);
          throw new Error(`RPC failed: ${error.message}`);
        }

        if (!data) return [];

        if (import.meta.env.DEV) console.log(`[OptimizedAssignmentService] RPC returned ${data.length} assignments`);
        
        const convertedData = data.map(assignment => {
          try {
            let carIds: string[] = [];
            if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
              carIds = assignment.car_ids.filter(id => id != null && id !== '');
            } else if (assignment.car_id) {
              carIds = [assignment.car_id];
            }

            return {
              id: assignment.id,
              title: assignment.title,
              description: assignment.description,
              assignment_date: assignment.assignment_date,
              from_time: assignment.from_time,
              to_time: assignment.to_time,
              location: assignment.location,
              type: assignment.type,
              published: assignment.published,
              responsible_user_id: assignment.responsible_user_id,
              created_at: assignment.created_at,
              updated_at: assignment.updated_at,
              car_id: assignment.car_id,
              car_ids: carIds,
              case_number: assignment.case_number || null,
              responsible_user: assignment.responsible_user ? {
                id: (assignment.responsible_user as any).id || '',
                name: (assignment.responsible_user as any).name || '',
              } : null,
              assignment_employees: Array.isArray(assignment.team) ? assignment.team.map((member: any) => ({
                user_id: member.id,
                profiles: { id: member.id, name: member.name || '', email: member.email || '' }
              })) : [],
              assignment_cars: []
            };
          } catch (conversionError) {
            if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Error converting assignment:', conversionError);
            return {
              id: assignment.id || '',
              title: assignment.title || 'Unknown Assignment',
              description: assignment.description || '',
              assignment_date: assignment.assignment_date || '',
              from_time: assignment.from_time || '08:00',
              to_time: assignment.to_time || '16:00',
              location: assignment.location || '',
              type: assignment.type || null,
              published: assignment.published || false,
              responsible_user_id: assignment.responsible_user_id || null,
              created_at: assignment.created_at || '',
              updated_at: assignment.updated_at || '',
              car_id: null,
              car_ids: [],
              case_number: assignment.case_number || null,
              responsible_user: null,
              assignment_employees: [],
              assignment_cars: []
            };
          }
        });

        return convertedData;
      } catch (rpcError) {
        if (import.meta.env.DEV) console.warn('[OptimizedAssignmentService] RPC failed, falling back to direct query:', rpcError);
        return this.fetchAssignmentsFallback(role);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Error fetching all assignments:', error);
      return [];
    }
  }

  private static async fetchAssignmentsFallback(role: string): Promise<OptimizedAssignmentData[]> {
    try {
      if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Using fallback assignment fetch');
      
      const isAdmin = role === 'administrator' || role === 'skadeleder';
      const query = supabase
        .from('assignments')
        .select(`id, title, description, assignment_date, from_time, to_time, location, type, published, responsible_user_id, created_at, updated_at, car_id, car_ids`)
        .order('assignment_date', { ascending: false })
        .order('from_time', { ascending: false });

      if (!isAdmin) {
        query.eq('published', true);
      }

      const { data: assignments, error } = await query;

      if (error) {
        if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Fallback query failed:', error);
        return [];
      }

      if (!assignments) return [];

      if (import.meta.env.DEV) console.log(`[OptimizedAssignmentService] Fallback returned ${assignments.length} assignments`);
      
      return await this.enrichAssignmentData(assignments);
      
    } catch (error) {
      if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Fallback fetch failed:', error);
      return [];
    }
  }

  static async fetchAllPublishedAssignments(userEmail?: string, departmentId?: string | null, subDepartmentId?: string | null): Promise<OptimizedAssignmentData[]> {
    try {
      const isDemoMode = userEmail === 'test@polygongroup.com' || sessionStorage.getItem('demo-mode') === 'true';
      
      if (isDemoMode) {
        if (isDemoNonHomeDepartment(true, departmentId)) {
          if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Non-home department in demo mode (published), returning empty');
          return [];
        }

        if (import.meta.env.DEV) console.log(`[OptimizedAssignmentService] DEMO MODE: Fetching demo published assignments`);
        const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
        
        if (error) {
          if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Demo RPC error:', error);
          return [];
        }
        
        if (!data) return [];
        
        const publishedData = data.filter((a: any) => a.published === true);
        if (import.meta.env.DEV) console.log(`[OptimizedAssignmentService] Demo: ${publishedData.length} published assignments`);
        
        // RLS ensures demo user sees is_demo=true data — no local merge needed
        return this.convertDemoAssignments(publishedData);
      }
      
      if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Fetching published assignments');
      
      const { data, error } = await supabase.rpc('list_accessible_assignments_with_team', {
        p_department_id: departmentId || null,
        p_sub_department_id: subDepartmentId || null
      });

      if (error) {
        if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Secure function error:', error);
        throw new Error(`Secure function error: ${error.message}`);
      }

      if (!data) return [];

      if (import.meta.env.DEV) console.log(`[OptimizedAssignmentService] Returned ${data.length} published assignments`);
      
      const convertedData = data.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        assignment_date: assignment.assignment_date,
        from_time: assignment.from_time,
        to_time: assignment.to_time,
        location: assignment.location,
        type: assignment.type,
        published: assignment.published,
        responsible_user_id: assignment.responsible_user_id,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        car_id: assignment.car_id,
        car_ids: assignment.car_ids,
        case_number: assignment.case_number || null,
        responsible_user: assignment.responsible_user ? {
          id: (assignment.responsible_user as any).id || '',
          name: (assignment.responsible_user as any).name || '',
        } : null,
        assignment_employees: Array.isArray(assignment.team) ? assignment.team.map((member: any) => ({
          user_id: member.id,
          profiles: { id: member.id, name: member.name }
        })) : [],
        assignment_cars: []
      }));
      
      return convertedData;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Error fetching all published assignments:', error);
      throw error;
    }
  }

  static async createAssignment(assignmentData: any, userEmail?: string): Promise<OptimizedAssignmentData> {
    this.clearCache();
    
    const isDemoMode = userEmail === 'test@polygongroup.com' || sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] DEMO MODE: Creating assignment in DB with is_demo=true');
      
      const { employees, ...demoInsert } = assignmentData;
      const employeeIds = Array.isArray(employees)
        ? employees.map((id: string) => sanitizeUUIDForDB(id)).filter(Boolean)
        : [];

      const { data, error } = await supabase
        .from('assignments')
        .insert({ ...demoInsert, is_demo: true })
        .select()
        .single();

      if (error) {
        if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Demo assignment DB insert error:', error);
        throw error;
      }

      if (employeeIds.length > 0) {
        const { error: linkError } = await supabase
          .from('assignments_employees')
          .insert(employeeIds.map((uid: string) => ({ assignment_id: data.id, user_id: uid, is_demo: true })));
        if (import.meta.env.DEV) if (linkError) console.error('[OptimizedAssignmentService] Demo employee link error:', linkError);
      }

      if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Demo assignment created in DB:', data.id);
      const enriched = await this.enrichAssignmentData([data]);
      return enriched[0];
    }
    
    // Production: write to DB
    const { employees, ...assignmentInsert } = assignmentData;
    const employeeIds = Array.isArray(employees) 
      ? employees.map(id => sanitizeUUIDForDB(id)).filter(Boolean)
      : [];
    
    if (import.meta.env.DEV) {
      console.log('[OptimizedAssignmentService] Insert payload:', assignmentInsert);
      if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Employee IDs:', employeeIds);
    }

    const { data, error } = await supabase.from('assignments').insert(assignmentInsert).select().single();
    if (error) {
      if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Error creating assignment:', error);
      throw error;
    }

    if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Assignment created:', data.id);

    if (employeeIds.length > 0) {
      const employeeLinks = employeeIds.map(userId => ({
        assignment_id: data.id,
        user_id: userId
      }));

      if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Linking employees:', employeeLinks);
      
      const { error: linkError } = await supabase
        .from('assignments_employees')
        .insert(employeeLinks);

      if (linkError) {
        if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Failed to link employees:', linkError);
        throw new Error(`Failed to link employees: ${linkError.message}`);
      }
    }
    
    const enriched = await this.enrichAssignmentData([data]);
    return enriched[0];
  }

  static async updateAssignment(assignmentId: string, updates: any, userEmail?: string): Promise<OptimizedAssignmentData> {
    this.clearCache();
    
    const isDemoMode = userEmail === 'test@polygongroup.com' || sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] DEMO MODE: Updating assignment in DB');
      
      const { employees, ...updatePayload } = updates;
      const { data, error } = await supabase
        .from('assignments')
        .update({ ...updatePayload, updated_at: new Date().toISOString() })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) {
        if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Demo update error:', error);
        throw error;
      }

      if (Array.isArray(employees)) {
        const employeeIds = employees.map((id: string) => sanitizeUUIDForDB(id)).filter(Boolean);
        await supabase.from('assignments_employees').delete().eq('assignment_id', assignmentId);
        if (employeeIds.length > 0) {
          await supabase.from('assignments_employees')
            .insert(employeeIds.map((uid: string) => ({ assignment_id: assignmentId, user_id: uid, is_demo: true })));
        }
      }

      const enriched = await this.enrichAssignmentData([data]);
      return enriched[0];
    }
    
    // Production: write to DB
    const { employees, ...updatePayload } = updates;
    const employeeIds = Array.isArray(employees)
      ? employees.map(id => sanitizeUUIDForDB(id)).filter(Boolean)
      : null;
    
    if (import.meta.env.DEV) {
      console.log('[OptimizedAssignmentService] Update payload:', updatePayload);
      if (import.meta.env.DEV) if (employeeIds !== null) console.log('[OptimizedAssignmentService] Employee IDs to relink:', employeeIds);
    }

    const { data, error } = await supabase.from('assignments').update(updatePayload).eq('id', assignmentId).select().single();
    if (error) {
      if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Error updating assignment:', error);
      throw error;
    }

    if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Assignment updated:', data.id);

    if (employeeIds !== null) {
      const { error: deleteError } = await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', assignmentId);

      if (deleteError) {
        if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Failed to delete old employee links:', deleteError);
        throw new Error(`Failed to unlink employees: ${deleteError.message}`);
      }

      if (employeeIds.length > 0) {
        const employeeLinks = employeeIds.map(userId => ({
          assignment_id: assignmentId,
          user_id: userId
        }));

        if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Relinking employees:', employeeLinks);
        
        const { error: linkError } = await supabase
          .from('assignments_employees')
          .insert(employeeLinks);

        if (linkError) {
          if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Failed to link employees:', linkError);
          throw new Error(`Failed to link employees: ${linkError.message}`);
        }
      }
    }
    
    const enriched = await this.enrichAssignmentData([data]);
    return enriched[0];
  }

  static async deleteAssignment(assignmentId: string, userEmail?: string): Promise<boolean> {
    const isDemoMode = userEmail === 'test@polygongroup.com' || sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Deleting demo assignment from DB:', assignmentId);
      
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) {
        if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Demo delete error:', error);
        return false;
      }

      this.clearCache();
      return true;
    }

    try {
      if (import.meta.env.DEV) console.log('[OptimizedAssignmentService] Deleting assignment:', assignmentId);
      
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) {
        if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Error deleting assignment:', error);
        return false;
      }
      
      this.clearCache();
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Error deleting assignment:', error);
      return false;
    }
  }

  static async fetchUnpublishedAssignments(userId: string, userRole: string, userEmail?: string, departmentId?: string | null, subDepartmentId?: string | null): Promise<OptimizedAssignmentData[]> {
    const isDemoMode = userEmail === 'test@polygongroup.com' || sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
      if (error || !data) return [];
      
      return this.convertDemoAssignments(data.filter((a: any) => !a.published));
    }
    
    const allAssignments = await this.fetchAllAssignments(userRole, userEmail, departmentId, subDepartmentId);
    return allAssignments.filter(a => !a.published);
  }

  static async fetchUserAssignments(userId: string, userRole: string, userEmail?: string, departmentId?: string | null, subDepartmentId?: string | null): Promise<OptimizedAssignmentData[]> {
    const isDemoMode = userEmail === 'test@polygongroup.com' || sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
      if (error || !data) return [];
      
      const filtered = data.filter((a: any) => 
        a.responsible_user_id === userId || a.team?.some((m: any) => m.id === userId)
      );
      return this.convertDemoAssignments(filtered);
    }
    
    const allAssignments = await this.fetchAllAssignments(userRole, userEmail, departmentId, subDepartmentId);
    return allAssignments.filter(a =>
      a.responsible_user_id === userId || a.assignment_employees.some(e => e.user_id === userId)
    );
  }

  static async fetchPublishedAssignmentsByDate(date: string, userEmail?: string, departmentId?: string | null, subDepartmentId?: string | null): Promise<OptimizedAssignmentData[]> {
    const isDemoMode = userEmail === 'test@polygongroup.com' || sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
      if (error || !data) return [];
      
      return this.convertDemoAssignments(data.filter((a: any) => a.published && a.assignment_date === date));
    }
    
    const allPublished = await this.fetchAllPublishedAssignments(userEmail, departmentId, subDepartmentId);
    return allPublished.filter(a => a.assignment_date === date);
  }

  static async publishAssignment(assignmentId: string, userEmail?: string): Promise<OptimizedAssignmentData> {
    const isDemoMode = userEmail === 'test@polygongroup.com' || sessionStorage.getItem('demo-mode') === 'true';
    if (isDemoMode) throw new Error('Demo mode is read-only. Cannot publish assignments.');
    return this.updateAssignment(assignmentId, { published: true }, userEmail);
  }

  static async publishAssignmentsByDate(date: string, userEmail?: string): Promise<boolean> {
    const isDemoMode = userEmail === 'test@polygongroup.com' || sessionStorage.getItem('demo-mode') === 'true';
    if (isDemoMode) throw new Error('Demo mode is read-only. Cannot publish assignments.');
    
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('assignment_date', date);
      
      if (error) {
        if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Error publishing assignments:', error);
        return false;
      }
      
      this.clearCache();
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[OptimizedAssignmentService] Error publishing assignments:', error);
      return false;
    }
  }
}
