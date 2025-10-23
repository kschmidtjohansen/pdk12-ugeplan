import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/types/assignment';
import { sanitizeUUIDForDB } from '@/utils/uuidValidation';

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
        const { data, error } = await supabase.rpc('list_demo_assignments_with_team');
        
        if (error) {
          console.error('[OptimizedAssignmentService] Demo RPC error:', error);
          return [];
        }
        
        if (!data) {
          console.log('[OptimizedAssignmentService] No demo assignments found');
          return [];
        }
        
        console.log(`[OptimizedAssignmentService] Demo RPC returned ${data.length} assignments`);
        return this.convertDemoAssignments(data);
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
        const { data, error } = await supabase.rpc('list_demo_assignments_with_team');
        
        if (error) {
          console.error('[OptimizedAssignmentService] Demo RPC error:', error);
          return [];
        }
        
        if (!data) return [];
        
        const publishedData = data.filter((a: any) => a.published === true);
        console.log(`[OptimizedAssignmentService] Demo RPC returned ${publishedData.length} published assignments`);
        return this.convertDemoAssignments(publishedData);
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
    
    const { data, error } = await supabase
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single();
      
    if (error) throw error;
    
    // Enrich and return the created assignment
    const enriched = await this.enrichAssignmentData([data]);
    return enriched[0];
  }

  static async updateAssignment(assignmentId: string, updates: any): Promise<OptimizedAssignmentData> {
    const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
    if (isDemoMode) {
      throw new Error('Demo mode is read-only. Cannot update assignments.');
    }

    this.clearCache();
    
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Enrich and return the updated assignment
    const enriched = await this.enrichAssignmentData([data]);
    return enriched[0];
  }

  static async deleteAssignment(assignmentId: string): Promise<boolean> {
    const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      throw new Error('Demo mode is read-only. Cannot delete assignments.');
    }

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) {
        console.error('[OptimizedAssignmentService] Error deleting assignment:', error);
        return false;
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
      const { data, error } = await supabase.rpc('list_demo_assignments_with_team');
      if (error || !data) return [];
      return this.convertDemoAssignments(data.filter((a: any) => !a.published));
    }
    
    const allAssignments = await this.fetchAllAssignments(userRole);
    return allAssignments.filter(a => !a.published);
  }

  static async fetchUserAssignments(userId: string, userRole: string): Promise<OptimizedAssignmentData[]> {
    const isDemoMode = sessionStorage.getItem('demo-mode') === 'true';
    
    if (isDemoMode) {
      const { data, error } = await supabase.rpc('list_demo_assignments_with_team');
      if (error || !data) return [];
      const filtered = data.filter((a: any) => 
        a.responsible_user_id === userId || a.team?.some((m: any) => m.id === userId)
      );
      return this.convertDemoAssignments(filtered);
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
      const { data, error } = await supabase.rpc('list_demo_assignments_with_team');
      if (error || !data) return [];
      return this.convertDemoAssignments(data.filter((a: any) => 
        a.published && a.assignment_date === date
      ));
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
