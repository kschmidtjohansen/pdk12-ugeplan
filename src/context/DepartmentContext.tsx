import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Department {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface DepartmentContextType {
  currentDepartment: Department | null;
  availableDepartments: Department[];
  setCurrentDepartment: (department: Department | null) => void;
  loading: boolean;
  validateDepartmentAccess: (departmentCode: string) => Promise<{
    valid: boolean;
    error?: string;
    department?: Department;
  }>;
  refreshDepartments: () => Promise<void>;
}

const DepartmentContext = createContext<DepartmentContextType>({
  currentDepartment: null,
  availableDepartments: [],
  setCurrentDepartment: () => {},
  loading: true,
  validateDepartmentAccess: async () => ({ valid: false }),
  refreshDepartments: async () => {},
});

interface DepartmentProviderProps {
  children: ReactNode;
}

export const DepartmentProvider: React.FC<DepartmentProviderProps> = ({ children }) => {
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Fetch available departments for the current user
  const fetchUserDepartments = async () => {
    if (!user || !isAuthenticated) {
      setAvailableDepartments([]);
      setCurrentDepartment(null);
      setLoading(false);
      return;
    }

    try {
      // Get user's accessible departments
      const { data: userDepartments, error } = await supabase
        .rpc('get_user_departments', { user_uuid: user.id });

      if (error) {
        console.error('Error fetching user departments:', error);
        setLoading(false);
        return;
      }

      if (userDepartments && userDepartments.length > 0) {
        const departments: Department[] = userDepartments.map((dept: any) => ({
          id: dept.department_id,
          name: dept.department_name,
          code: dept.department_code,
          is_active: true
        }));

        setAvailableDepartments(departments);

        // Set primary department as current if not already set
        if (!currentDepartment) {
          const primaryDept = userDepartments.find((dept: any) => dept.is_primary);
          if (primaryDept) {
            setCurrentDepartment({
              id: primaryDept.department_id,
              name: primaryDept.department_name,
              code: primaryDept.department_code,
              is_active: true
            });
          } else {
            // Fall back to first department
            setCurrentDepartment(departments[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchUserDepartments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validate if user has access to a specific department
  const validateDepartmentAccess = async (departmentCode: string) => {
    if (!user || !isAuthenticated) {
      return { valid: false, error: 'user_not_authenticated' };
    }

    try {
      const { data, error } = await supabase
        .rpc('validate_user_department_access', { dept_code: departmentCode });

      if (error) {
        console.error('Error validating department access:', error);
        return { valid: false, error: 'validation_error' };
      }

      const result = data as any;
      if (result.valid) {
        return {
          valid: true,
          department: {
            id: result.department_id,
            name: result.department_name,
            code: departmentCode,
            is_active: true
          }
        };
      } else {
        return {
          valid: false,
          error: result.error || 'access_denied'
        };
      }
    } catch (error) {
      console.error('Error in validateDepartmentAccess:', error);
      return { valid: false, error: 'validation_error' };
    }
  };

  // Refresh departments list
  const refreshDepartments = async () => {
    setLoading(true);
    await fetchUserDepartments();
  };

  // Load user departments when user changes
  useEffect(() => {
    fetchUserDepartments();
  }, [user, isAuthenticated]);

  const value = {
    currentDepartment,
    availableDepartments,
    setCurrentDepartment,
    loading,
    validateDepartmentAccess,
    refreshDepartments,
  };

  return (
    <DepartmentContext.Provider value={value}>
      {children}
    </DepartmentContext.Provider>
  );
};

export const useDepartment = () => {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error('useDepartment must be used within a DepartmentProvider');
  }
  return context;
};