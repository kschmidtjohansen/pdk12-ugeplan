
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
  responsibleUserId?: string;
  employees?: string[]; // Always use string[] for consistency
  car?: string | { id: string; name: string };
  cars?: string[];
  createdAt?: string;
  updatedAt?: string;
  responsibleUser?: {
    id: string;
    name: string;
  };
}

// Helper function to convert various employee formats to string[]
export const normalizeEmployees = (employees?: string[] | Array<{ id: string; name: string }>): string[] => {
  if (!employees) return [];
  if (Array.isArray(employees)) {
    return employees.map(emp => 
      typeof emp === 'string' ? emp : emp.name
    );
  }
  return [];
};
