
import { supabase } from '@/integrations/supabase/client';
import { getEffectiveRole } from '@/utils/roleHierarchy';
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';

interface DataFetchResult<T> {
  data: T[];
  error: string | null;
  fromCache: boolean;
}

class UnifiedDataService {
  async fetchEmployees(departmentId?: string, subDepartmentId?: string | null): Promise<DataFetchResult<Employee>> {

    try {
      // If sub-department is selected, restrict to users linked via user_access.sub_department_id
      let allowedUserIds: string[] | null = null;
      if (subDepartmentId) {
        const { data: accessRows, error: accessError } = await supabase
          .from('user_access')
          .select('user_id')
          .eq('sub_department_id', subDepartmentId);

        if (accessError) {
          throw new Error(`User access fetch failed: ${accessError.message}`);
        }

        allowedUserIds = (accessRows || []).map(r => r.user_id).filter(Boolean);

        if (allowedUserIds.length === 0) {
          const empty: Employee[] = [];
          return { data: empty, error: null, fromCache: false };
        }
      }

      let query = supabase
        .from('profiles')
        .select('id, name, email, phone, job_title, on_leave, notes, avatar_url, status, home_department_id, is_temporary, expires_at')
        .eq('is_demo', false)
        .order('name', { ascending: true });

      if (departmentId) {
        query = query.eq('home_department_id', departmentId);
      }

      if (allowedUserIds) {
        query = query.in('id', allowedUserIds);
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
        const userRoles = rolesData?.filter(r => r.user_id === profile.id) || [];
        // Highest-privilege role wins when a user holds multiple roles.
        const primaryRole = getEffectiveRole(userRoles.map(r => r.role));

        return {
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: primaryRole,
          roles: userRoles.map(r => r.role),
          onLeave: profile.on_leave || false,
          status: profile.status || 'active',
          notes: profile.notes || '',
          avatar_url: profile.avatar_url,
          is_temporary: (profile as { is_temporary?: boolean; expires_at?: string }).is_temporary || false,
          expires_at: (profile as { is_temporary?: boolean; expires_at?: string }).expires_at || undefined
        } as Employee;
      });

      return { data: employees, error: null, fromCache: false };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { data: [], error: errorMessage, fromCache: false };
    }
  }

  async fetchAssignments(
    departmentId?: string,
    subDepartmentId?: string | null,
    dateRange?: { fromDate?: string; toDate?: string }
  ): Promise<DataFetchResult<Assignment>> {

    try {
      let query = supabase
        .from('assignments')
        .select(`
          id, title, description, assignment_date, from_time, to_time,
          location, car_id, car_ids, published, responsible_user_id,
          created_at, updated_at, department_id, sub_department_id, lat, lng
        `)
        .eq('is_demo', false)
        .order('assignment_date', { ascending: true });

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      if (subDepartmentId) {
        query = query.eq('sub_department_id', subDepartmentId);
      }

      // Date window keeps the payload small — without it we would load the
      // department's entire assignment history on every page load.
      if (dateRange?.fromDate) {
        query = query.gte('assignment_date', dateRange.fromDate);
      }

      if (dateRange?.toDate) {
        query = query.lte('assignment_date', dateRange.toDate);
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
          lat: assignment.lat ?? undefined,
          lng: assignment.lng ?? undefined,
          responsibleUser: null
        };
      });

      return { data: assignments, error: null, fromCache: false };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { data: [], error: errorMessage, fromCache: false };
    }
  }

  async fetchCars(departmentId?: string, subDepartmentId?: string | null): Promise<DataFetchResult<Car>> {

    try {
      // If sub-department is selected, restrict to cars linked via car_sub_departments
      let allowedCarIds: string[] | null = null;
      if (subDepartmentId) {
        const { data: linkRows, error: linkError } = await supabase
          .from('car_sub_departments')
          .select('car_id')
          .eq('sub_department_id', subDepartmentId);

        if (linkError) {
          throw new Error(`Car sub-department fetch failed: ${linkError.message}`);
        }

        allowedCarIds = (linkRows || []).map(r => r.car_id).filter(Boolean);

        if (allowedCarIds.length === 0) {
          const empty: Car[] = [];
          return { data: empty, error: null, fromCache: false };
        }
      }

      let query = supabase
        .from('cars')
        .select('*')
        .eq('is_demo', false)
        .order('name', { ascending: true });

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      if (allowedCarIds) {
        query = query.in('id', allowedCarIds);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Cars fetch failed: ${error.message}`);
      }

      let cars = data || [];

      // "Alle": cars assigned to a sub-department belong only there.
      if (!subDepartmentId && cars.length > 0) {
        const { data: linked, error: linkedError } = await supabase
          .from('car_sub_departments')
          .select('car_id')
          .in('car_id', cars.map(c => c.id));
        if (linkedError) throw new Error(`Car sub-department fetch failed: ${linkedError.message}`);
        const linkedIds = new Set((linked || []).map(r => r.car_id));
        cars = cars.filter(c => !linkedIds.has(c.id));
      }

      return { data: sortCarsByNumber(cars), error: null, fromCache: false };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { data: [], error: errorMessage, fromCache: false };
    }
  }

}

export const unifiedDataService = new UnifiedDataService();
