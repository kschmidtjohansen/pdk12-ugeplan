
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { systemHealthService } from '../systemHealthService';

interface DataFetchResult<T> {
  data: T[];
  error: string | null;
  fromCache: boolean;
}

class UnifiedDataService {
  private cache = new Map<string, { data: any[]; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(operation: string, departmentId?: string): string {
    return departmentId ? `unified_${operation}_${departmentId}` : `unified_${operation}`;
  }

  private getFromCache<T>(key: string): T[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache<T>(key: string, data: T[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });
  }

  async fetchEmployees(departmentId?: string): Promise<DataFetchResult<Employee>> {
    const cacheKey = this.getCacheKey('employees', departmentId);
    
    const cachedData = this.getFromCache<Employee>(cacheKey);
    if (cachedData) {
      return { data: cachedData, error: null, fromCache: true };
    }

    try {
      let query = supabase
        .from('profiles')
        .select('id, name, email, phone, job_title, on_leave, notes, avatar_url, status, home_department_id')
        .order('name', { ascending: true });

      if (departmentId) {
        query = query.eq('home_department_id', departmentId);
      }

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) {
        throw new Error(`Profiles fetch failed: ${profilesError.message}`);
      }

      if (!profilesData) {
        return { data: [], error: null, fromCache: false };
      }

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', profilesData.map(p => p.id));

      const employees: Employee[] = profilesData.map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        
        return {
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: userRole?.role || 'servicemedarbejder',
          onLeave: profile.on_leave || false,
          status: profile.status || 'active', // Add status from database
          notes: profile.notes || '',
          avatar_url: profile.avatar_url
        };
      });

      this.setCache(cacheKey, employees);
      return { data: employees, error: null, fromCache: false };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { data: [], error: errorMessage, fromCache: false };
    }
  }

  async fetchAssignments(departmentId?: string): Promise<DataFetchResult<Assignment>> {
    const cacheKey = this.getCacheKey('assignments', departmentId);
    
    const cachedData = this.getFromCache<Assignment>(cacheKey);
    if (cachedData) {
      return { data: cachedData, error: null, fromCache: true };
    }

    try {
      let query = supabase
        .from('assignments')
        .select(`
          id, title, description, assignment_date, from_time, to_time,
          location, car_id, car_ids, published, responsible_user_id,
          created_at, updated_at, department_id
        `)
        .order('assignment_date', { ascending: true });

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data: assignmentsData, error: assignmentsError } = await query;

      if (assignmentsError) {
        throw new Error(`Assignments fetch failed: ${assignmentsError.message}`);
      }

      if (!assignmentsData) {
        return { data: [], error: null, fromCache: false };
      }

      const assignmentIds = assignmentsData.map(a => a.id);
      let employeeAssignments: any[] = [];
      let profilesData: any[] = [];

      if (assignmentIds.length > 0) {
        const { data: empData } = await supabase
          .from('assignments_employees')
          .select('assignment_id, user_id')
          .in('assignment_id', assignmentIds);
        
        employeeAssignments = empData || [];

        if (employeeAssignments.length > 0) {
          const userIds = [...new Set(employeeAssignments.map(ae => ae.user_id))];
          const { data: profData } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
          
          profilesData = profData || [];
        }
      }

      const assignments: Assignment[] = assignmentsData.map(assignment => {
        const assignmentEmployees = employeeAssignments.filter(ae => ae.assignment_id === assignment.id);
        const employees = assignmentEmployees
          .map(ae => {
            const profile = profilesData.find(p => p.id === ae.user_id);
            return profile?.name;
          })
          .filter(Boolean);

        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          date: assignment.assignment_date,
          fromTime: assignment.from_time,
          toTime: assignment.to_time,
          location: assignment.location,
          type: 'other' as const,
          published: assignment.published,
          responsibleUserId: assignment.responsible_user_id || '',
          employees: employees,
          car: assignment.car_id || '',
          cars: assignment.car_ids || [],
          createdAt: assignment.created_at,
          updatedAt: assignment.updated_at,
          responsibleUser: null
        };
      });

      this.setCache(cacheKey, assignments);
      return { data: assignments, error: null, fromCache: false };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { data: [], error: errorMessage, fromCache: false };
    }
  }

  async fetchCars(departmentId?: string): Promise<DataFetchResult<Car>> {
    const cacheKey = this.getCacheKey('cars', departmentId);
    
    const cachedData = this.getFromCache<Car>(cacheKey);
    if (cachedData) {
      return { data: cachedData, error: null, fromCache: true };
    }

    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Cars fetch failed: ${error.message}`);
      }

      const cars = data || [];
      this.setCache(cacheKey, cars);
      return { data: cars, error: null, fromCache: false };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { data: [], error: errorMessage, fromCache: false };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getStatus() {
    return {
      cacheSize: this.cache.size,
      cacheEntries: Array.from(this.cache.keys())
    };
  }
}

export const unifiedDataService = new UnifiedDataService();
