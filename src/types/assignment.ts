
export interface Assignment {
  id: string;
  title: string;
  description?: string;
  date: string;
  fromTime: string;
  toTime: string;
  location: string;
  type?: string;
  published: boolean;
  case_number?: string;
  responsibleUserId?: string;
  employees?: string[]; // Now stores employee IDs (UUIDs) instead of names
  assignedEmployees?: Array<{ id: string; name: string; email: string }>; // PHASE 3 FIX: Full employee data
  car?: string | { id: string; name: string };
  cars?: string[];
  zip_code?: string;
  city?: string;
  lat?: number;
  lng?: number;
  createdAt?: string;
  updatedAt?: string;
  groupId?: string;
  responsibleUser?: {
    id: string;
    name: string;
    role?: string;
  };
}

// Helper function to convert various employee formats to string[] of IDs
export const normalizeEmployees = (employees?: string[] | Array<{ id: string; name: string }>): string[] => {
  if (!employees) return [];
  if (Array.isArray(employees)) {
    return employees.map(emp => 
      typeof emp === 'string' ? emp : emp.id
    );
  }
  return [];
};

// Helper function to get employee names from IDs for display purposes
export const getEmployeeNamesFromIds = (employeeIds: string[], employees: Array<{ id: string; name: string }>): string[] => {
  return employeeIds.map(id => {
    const employee = employees.find(emp => emp.id === id);
    return employee?.name || id;
  });
};
