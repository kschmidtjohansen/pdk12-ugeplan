import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { Assignment } from '@/types/assignment';
import { sanitizeUUIDForDB } from '@/utils/uuidValidation';
import { DemoUserService } from '@/services/demoUserService';
import { rpcWithRefresh } from '@/integrations/supabase/safeRpc';

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
  cache.set(cacheKey, {
    data,
    metadata: { timestamp: Date.now() }
  } as any);
};

const getFromCache = (cacheKey: string): OptimizedAssignmentData[] | undefined => {
  const cachedData = cache.get(cacheKey);
  if (cachedData && isCacheValid(cacheKey)) {
    console.log(`[OptimizedAssignmentService] Returning data from cache for key: ${cacheKey}`);
    return (cachedData as any).data;
  }
  return undefined;
};

export class OptimizedAssignmentService {
  static clearCache(): void {
    cache.clear();
    console.log('[OptimizedAssignmentService] Cache cleared');
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

  // Convert locally stored demo assignment to OptimizedAssignmentData
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
        console.warn('[OptimizedAssignmentService] Assignment employees fetch error:', employeeError);
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
        
        console.warn(`[OptimizedAssignmentService] Profiles fetch error (attempt ${retryCount + 1}):`, profilesError);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          console.error('[OptimizedAssignmentService] CRITICAL: Failed to fetch profiles after all retries.');
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
          console.warn(`[OptimizedAssignmentService] Profile not found for user ID: ${emp.user_id}`);
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
      console.error('[OptimizedAssignmentService] Error fetching assignment employees:', error);
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
        console.warn('[OptimizedAssignmentService] Cars fetch error:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching cars:', error);
      return [];
    }
  }

  private static async enrichAssignmentData(assignments: any[]): Promise<OptimizedAssignmentData[]> {
    const assignmentIds = assignments.map(a => a.id);
    
    const employeesData = await this.fetchAssignmentEmployees(assignmentIds);
    
    const allCarIds = new Set<string>();
    assignments.forEach(assignment => {
      if (assignment.car_id) {
        allCarIds.add(assignment.car_id);
      }
      if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
        assignment.car_ids.forEach((carId: string) => allCarIds.add(carId));
      }
    });
    
    const carsData = await this.fetchAssignmentCars(Array.from(allCarIds));
    
    return assignments.map(assignment => {
      const assignmentEmployees = employeesData
        .filter(emp => emp.assignment_id === assignment.id)
        .map(emp => ({
          user_id: emp.user_id,
          profiles: emp.profiles
        }));
      
      let assignmentCars: { id: string; name: string; }[] = [];
      
      if (assignment.car_ids && Array.isArray(assignment.car_ids)) {
        assignmentCars = assignment.car_ids
          .map((carId: string) => carsData.find(car => car.id === carId))
          .filter(Boolean)
          .map((car: any) => ({ id: car.id, name: car.name }));
      } else if (assignment.car_id) {
        const car = carsData.find(car => car.id === assignment.car_id);
        if (car) {
          assignmentCars = [{ id: car.id, name: car.name }];
        }
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

  static async fetchAllAssignments(role: string): Promise<OptimizedAssignmentData[]> {
    try {
      // Check for demo mode
      const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
      
      if (isDemoMode) {
        console.log(`[OptimizedAssignmentService] DEMO MODE: Fetching demo assignments`);
        const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
        
        if (error) {
          console.error('[OptimizedAssignmentService] Demo RPC error:', error);
          return [];
        }
        
        if (!data) {
          console.log('[OptimizedAssignmentService] No demo assignments found');
          return [];
        }
        
        console.log(`[OptimizedAssignmentService] Demo RPC returned ${data.length} assignments`);
        
        // Merge with locally stored demo assignments
        const baselineConverted = this.convertDemoAssignments(data);
        const localDemos = DemoUserService.getInstance().getDemoAssignments();
        const localConverted = localDemos.map(demo => this.convertStoredDemoToOptimized(demo));
        
        console.log(`[OptimizedAssignmentService] Merging ${baselineConverted.length} baseline + ${localConverted.length} local demo assignments`);
        return [...baselineConverted, ...localConverted];
      }
      
      console.log(`[OptimizedAssignmentService] Using secure function for all assignments, role: ${role}`);

      try {
        const { data, error } = await supabase.rpc('list_accessible_assignments_with_team');

        if (error) {
          console.error('[OptimizedAssignmentService] RPC error:', error);
          throw new Error(`RPC failed: ${error.message}`);
        }

        if (!data) {
          console.log('[OptimizedAssignmentService] No assignments found from secure function');
          return [];
        }

        console.log(`[OptimizedAssignmentService] Secure function returned ${data.length} assignments`);
        
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
            console.error('[OptimizedAssignmentService] Error converting assignment:', conversionError, assignment);
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

        console.log('[OptimizedAssignmentService] Sample converted data:', convertedData[0]);
        return convertedData;
      } catch (rpcError) {
        console.warn('[OptimizedAssignmentService] RPC failed, falling back to direct query:', rpcError);
        return this.fetchAssignmentsFallback(role);
      }
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching all assignments:', error);
      return [];
    }
  }

  private static async fetchAssignmentsFallback(role: string): Promise<OptimizedAssignmentData[]> {
    try {
      console.log('[OptimizedAssignmentService] Using fallback assignment fetch');
      
      const isAdmin = role === 'administrator' || role === 'skadeleder';
      const query = supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          assignment_date,
          from_time,
          to_time,
          location,
          type,
          published,
          responsible_user_id,
          created_at,
          updated_at,
          car_id,
          car_ids
        `)
        .order('assignment_date', { ascending: false })
        .order('from_time', { ascending: false });

      if (!isAdmin) {
        query.eq('published', true);
      }

      const { data: assignments, error } = await query;

      if (error) {
        console.error('[OptimizedAssignmentService] Fallback query failed:', error);
        return [];
      }

      if (!assignments) {
        return [];
      }

      console.log(`[OptimizedAssignmentService] Fallback returned ${assignments.length} assignments`);
      
      const enrichedData = await this.enrichAssignmentData(assignments);
      
      console.log('[OptimizedAssignmentService] Sample fallback data:', enrichedData[0]);
      return enrichedData;
      
    } catch (error) {
      console.error('[OptimizedAssignmentService] Fallback fetch failed:', error);
      return [];
    }
  }

  static async fetchAllPublishedAssignments(): Promise<OptimizedAssignmentData[]> {
    try {
      // Check for demo mode
      const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
      
      if (isDemoMode) {
        console.log(`[OptimizedAssignmentService] DEMO MODE: Fetching demo published assignments`);
        const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
        
        if (error) {
          console.error('[OptimizedAssignmentService] Demo RPC error:', error);
          return [];
        }
        
        if (!data) return [];
        
        const publishedData = data.filter((a: any) => a.published === true);
        console.log(`[OptimizedAssignmentService] Demo RPC returned ${publishedData.length} published assignments`);
        
        // Merge with locally stored demo assignments
        const baselineConverted = this.convertDemoAssignments(publishedData);
        const localDemos = DemoUserService.getInstance().getDemoAssignments();
        const localConverted = localDemos
          .filter(demo => demo.published === true)
          .map(demo => this.convertStoredDemoToOptimized(demo));
        
        return [...baselineConverted, ...localConverted];
      }
      
      console.log('[OptimizedAssignmentService] Using secure function for published assignments');
      
      const { data, error } = await supabase.rpc('list_accessible_assignments_with_team');

      if (error) {
        console.error('[OptimizedAssignmentService] Secure function error:', error);
        throw new Error(`Secure function error: ${error.message}`);
      }

      if (!data) {
        console.log('[OptimizedAssignmentService] No published assignments found from secure function');
        return [];
      }

      console.log(`[OptimizedAssignmentService] Secure function returned ${data.length} published assignments`);
      
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
      
      console.log('[OptimizedAssignmentService] SERVICEMEDARBEJDER - Sample converted data:', convertedData[0]);
      return convertedData;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error fetching all published assignments:', error);
      throw error;
    }
  }

  static async createAssignment(assignmentData: any): Promise<OptimizedAssignmentData> {
    this.clearCache();
    
    const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      // Virtualize demo creation - no DB write
      console.log('[OptimizedAssignmentService] DEMO MODE: Virtualizing assignment creation');
      
      const now = new Date().toISOString();
      const demoId = `demo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const demoAssignment = {
        id: demoId,
        title: assignmentData.title,
        description: assignmentData.description || null,
        assignment_date: assignmentData.assignment_date,
        from_time: assignmentData.from_time,
        to_time: assignmentData.to_time,
        location: assignmentData.location,
        type: assignmentData.type || null,
        published: assignmentData.published || false,
        responsible_user_id: assignmentData.responsible_user_id || null,
        car_id: assignmentData.car_id || null,
        car_ids: assignmentData.car_ids || [],
        employees: assignmentData.employees || [],
        created_at: now,
        updated_at: now
      };
      
      DemoUserService.getInstance().storeDemoAssignment(demoAssignment);
      console.log('[OptimizedAssignmentService] Demo assignment stored locally:', demoId);
      
      return this.convertStoredDemoToOptimized(demoAssignment);
    }
    
    // Production: write to DB
    // Separate employees from assignment data
    const { employees, ...assignmentInsert } = assignmentData;
    const employeeIds = Array.isArray(employees) 
      ? employees.map(id => sanitizeUUIDForDB(id)).filter(Boolean)
      : [];
    
    console.log('[OptimizedAssignmentService] Insert payload (no employees):', assignmentInsert);
    console.log('[OptimizedAssignmentService] Employee IDs to link:', employeeIds);

    const { data, error } = await supabase.from('assignments').insert(assignmentInsert).select().single();
    if (error) {
      console.error('[OptimizedAssignmentService] Error creating assignment:', error);
      throw error;
    }

    console.log('[OptimizedAssignmentService] Assignment created:', data.id);

    // Link employees if any
    if (employeeIds.length > 0) {
      const employeeLinks = employeeIds.map(userId => ({
        assignment_id: data.id,
        user_id: userId
      }));

      console.log('[OptimizedAssignmentService] Linking employees:', employeeLinks);
      
      const { error: linkError } = await supabase
        .from('assignments_employees')
        .insert(employeeLinks);

      if (linkError) {
        console.error('[OptimizedAssignmentService] Failed to link employees:', linkError);
        throw new Error(`Failed to link employees: ${linkError.message}`);
      }

      console.log('[OptimizedAssignmentService] Employees linked successfully');
    }
    
    // Enrich and return the created assignment
    const enriched = await this.enrichAssignmentData([data]);
    return enriched[0];
  }

  static async updateAssignment(assignmentId: string, updates: any): Promise<OptimizedAssignmentData> {
    this.clearCache();
    
    const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      // Virtualize demo update - no DB write
      console.log('[OptimizedAssignmentService] DEMO MODE: Virtualizing assignment update');
      
      const localDemos = DemoUserService.getInstance().getDemoAssignments();
      const existing = localDemos.find(d => d.id === assignmentId);
      
      if (!existing) {
        throw new Error('Demo assignment not found for update');
      }
      
      const updated = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      DemoUserService.getInstance().updateDemoAssignment(assignmentId, updates);
      console.log('[OptimizedAssignmentService] Demo assignment updated locally:', assignmentId);
      
      return this.convertStoredDemoToOptimized(updated);
    }
    
    // Production: write to DB
    // Separate employees from update payload
    const { employees, ...updatePayload } = updates;
    const employeeIds = Array.isArray(employees)
      ? employees.map(id => sanitizeUUIDForDB(id)).filter(Boolean)
      : null;
    
    console.log('[OptimizedAssignmentService] Update payload (no employees):', updatePayload);
    if (employeeIds !== null) {
      console.log('[OptimizedAssignmentService] Employee IDs to relink:', employeeIds);
    }

    const { data, error } = await supabase.from('assignments').update(updatePayload).eq('id', assignmentId).select().single();
    if (error) {
      console.error('[OptimizedAssignmentService] Error updating assignment:', error);
      throw error;
    }

    console.log('[OptimizedAssignmentService] Assignment updated:', data.id);

    // Relink employees if provided
    if (employeeIds !== null) {
      // Delete existing links
      const { error: deleteError } = await supabase
        .from('assignments_employees')
        .delete()
        .eq('assignment_id', assignmentId);

      if (deleteError) {
        console.error('[OptimizedAssignmentService] Failed to delete old employee links:', deleteError);
        throw new Error(`Failed to unlink employees: ${deleteError.message}`);
      }

      // Insert new links
      if (employeeIds.length > 0) {
        const employeeLinks = employeeIds.map(userId => ({
          assignment_id: assignmentId,
          user_id: userId
        }));

        console.log('[OptimizedAssignmentService] Relinking employees:', employeeLinks);
        
        const { error: linkError } = await supabase
          .from('assignments_employees')
          .insert(employeeLinks);

        if (linkError) {
          console.error('[OptimizedAssignmentService] Failed to link employees:', linkError);
          throw new Error(`Failed to link employees: ${linkError.message}`);
        }

        console.log('[OptimizedAssignmentService] Employees relinked successfully');
      }
    }
    
    // Enrich and return the updated assignment
    const enriched = await this.enrichAssignmentData([data]);
    return enriched[0];
  }

  static async deleteAssignment(assignmentId: string): Promise<boolean> {
    const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
    
    // Virtualize for demo mode
    if (isDemoMode && assignmentId.startsWith('demo-')) {
      console.log('[OptimizedAssignmentService] Deleting demo assignment locally:', assignmentId);
      
      // Fetch the assignment data before deletion for logging
      const demoAssignment = DemoUserService.getInstance().getDemoAssignments()
        .find(a => a.id === assignmentId);
      
      if (demoAssignment) {
        // Import dynamically to avoid circular dependencies
        const { PlannerChangeLogger } = await import('./plannerChangeLogger');
        await PlannerChangeLogger.logDelete(assignmentId, {
          title: demoAssignment.title,
          date: demoAssignment.date,
          case_number: demoAssignment.case_number,
          location: demoAssignment.location
        });
      }
      
      DemoUserService.getInstance().deleteDemoAssignment(assignmentId);
      this.clearCache();
      return true;
    }

    try {
      // Fetch assignment data before deletion for logging
      const { data: assignment } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();
      
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) {
        console.error('[OptimizedAssignmentService] Error deleting assignment:', error);
        return false;
      }
      
      // Log the deletion
      if (assignment) {
        console.log('[OptimizedAssignmentService] Deleting assignment with data:', {
          id: assignmentId,
          date: assignment.assignment_date,
          case_number: assignment.case_number
        });
        
        const { PlannerChangeLogger } = await import('./plannerChangeLogger');
        await PlannerChangeLogger.logDelete(assignmentId, {
          title: assignment.title,
          date: assignment.assignment_date,
          case_number: assignment.case_number,
          location: assignment.location
        });
      }
      
      this.clearCache();
      return true;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error deleting assignment:', error);
      return false;
    }
  }

  static async fetchUnpublishedAssignments(userId: string, userRole: string): Promise<OptimizedAssignmentData[]> {
    const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
      if (error || !data) return [];
      
      const baselineUnpublished = this.convertDemoAssignments(data.filter((a: any) => !a.published));
      const localDemos = DemoUserService.getInstance().getDemoAssignments();
      const localUnpublished = localDemos
        .filter(demo => !demo.published)
        .map(demo => this.convertStoredDemoToOptimized(demo));
      
      return [...baselineUnpublished, ...localUnpublished];
    }
    
    const allAssignments = await this.fetchAllAssignments(userRole);
    return allAssignments.filter(a => !a.published);
  }

  static async fetchUserAssignments(userId: string, userRole: string): Promise<OptimizedAssignmentData[]> {
    const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
      if (error || !data) return [];
      
      const baselineFiltered = data.filter((a: any) => 
        a.responsible_user_id === userId || a.team?.some((m: any) => m.id === userId)
      );
      const baselineConverted = this.convertDemoAssignments(baselineFiltered);
      
      const localDemos = DemoUserService.getInstance().getDemoAssignments();
      const localFiltered = localDemos.filter(demo =>
        demo.responsible_user_id === userId || demo.employees?.includes(userId)
      );
      const localConverted = localFiltered.map(demo => this.convertStoredDemoToOptimized(demo));
      
      return [...baselineConverted, ...localConverted];
    }
    
    const allAssignments = await this.fetchAllAssignments(userRole);
    const filtered = allAssignments.filter(a => 
      a.responsible_user_id === userId || a.assignment_employees.some(e => e.user_id === userId)
    );
    return filtered;
  }

  static async fetchPublishedAssignmentsByDate(date: string): Promise<OptimizedAssignmentData[]> {
    const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      const { data, error } = await rpcWithRefresh('list_demo_assignments_with_team');
      if (error || !data) return [];
      
      const baselineFiltered = data.filter((a: any) => a.published && a.assignment_date === date);
      const baselineConverted = this.convertDemoAssignments(baselineFiltered);
      
      const localDemos = DemoUserService.getInstance().getDemoAssignments();
      const localFiltered = localDemos.filter(demo => 
        demo.published && demo.assignment_date === date
      );
      const localConverted = localFiltered.map(demo => this.convertStoredDemoToOptimized(demo));
      
      return [...baselineConverted, ...localConverted];
    }
    
    const allPublished = await this.fetchAllPublishedAssignments();
    return allPublished.filter(a => a.assignment_date === date);
  }

  static async publishAssignment(assignmentId: string): Promise<OptimizedAssignmentData> {
    const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
    if (isDemoMode) {
      throw new Error('Demo mode is read-only. Cannot publish assignments.');
    }
    return this.updateAssignment(assignmentId, { published: true });
  }

  static async publishAssignmentsByDate(date: string): Promise<boolean> {
    const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
    if (isDemoMode) {
      throw new Error('Demo mode is read-only. Cannot publish assignments.');
    }
    
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ published: true })
        .eq('assignment_date', date);
      
      if (error) {
        console.error('[OptimizedAssignmentService] Error publishing assignments:', error);
        return false;
      }
      
      this.clearCache();
      return true;
    } catch (error) {
      console.error('[OptimizedAssignmentService] Error publishing assignments:', error);
      return false;
    }
  }
}
