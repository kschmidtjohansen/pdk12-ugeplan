import { Assignment } from '@/types/assignment';

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
      email?: string;
    }
  }[];
  assignment_cars: {
    id: string;
    name: string;
  }[];
}

/**
 * SHARED conversion function used by both planner and screen display
 * This ensures data consistency between all views
 */
export const convertOptimizedAssignmentToAssignment = (data: OptimizedAssignmentData): Assignment => {
  console.log('[convertOptimizedAssignmentToAssignment] Converting data:', {
    id: data.id,
    title: data.title,
    published: data.published,
    assignment_employees: data.assignment_employees?.length || 0,
    assignment_cars: data.assignment_cars?.length || 0,
    responsible_user: data.responsible_user
  });

  const assignment: Assignment = {
    id: data.id,
    title: data.title,
    description: data.description,
    date: data.assignment_date, // Convert assignment_date to date
    fromTime: data.from_time,   // Convert from_time to fromTime
    toTime: data.to_time,       // Convert to_time to toTime
    location: data.location,
    type: data.type,
    published: data.published,
    responsibleUserId: data.responsible_user_id,
    // CRITICAL FIX: employees should be array of IDs for consistency
    employees: data.assignment_employees?.map((emp: any) => emp.user_id) || [],
  // assignedEmployees provides full employee data for display
  assignedEmployees: data.assignment_employees?.map((emp: any) => {
    const profileName = emp.profiles?.name;
    const profileEmail = emp.profiles?.email;
    
    // Function to check if a string is a UUID
    const isUUID = (str: string) => {
      if (!str || typeof str !== 'string') return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };
    
    // Determine the best name to use
    let displayName = 'Unknown User';
    
    if (profileName && profileName.trim() && !isUUID(profileName)) {
      displayName = profileName.trim();
    } else if (profileEmail && profileEmail.includes('@')) {
      displayName = profileEmail.split('@')[0];
    }
    
    return {
      id: emp.user_id,
      name: displayName,
      email: profileEmail || ''
    };
  }) || [],
    // Cars array for display (names)
    cars: data.assignment_cars?.map((car: any) => car.name) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    responsibleUser: data.responsible_user ? {
      id: data.responsible_user.id,
      name: data.responsible_user.name
    } : undefined
  };

  console.log('[convertOptimizedAssignmentToAssignment] ✅ Converted assignment:', {
    id: assignment.id,
    title: assignment.title,
    published: assignment.published,
    employeeCount: assignment.employees?.length || 0,
    employeeNames: assignment.assignedEmployees?.map(e => e.name) || [],
    carCount: assignment.cars?.length || 0,
    carNames: assignment.cars || [],
    responsibleUser: assignment.responsibleUser?.name
  });
  
  return assignment;
};