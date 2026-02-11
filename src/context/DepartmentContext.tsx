import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { unifiedDataService } from '@/services/data/unifiedDataService';

interface Department {
  id: string;
  name: string;
}

interface DepartmentContextType {
  departments: Department[];
  userDepartments: Department[];
  selectedDepartmentId: string | null;
  selectedDepartment: Department | null;
  setSelectedDepartmentId: (id: string | null) => void;
  switchDepartment: (id: string) => void;
  loading: boolean;
}

const DepartmentContext = createContext<DepartmentContextType>({
  departments: [],
  userDepartments: [],
  selectedDepartmentId: null,
  selectedDepartment: null,
  setSelectedDepartmentId: () => {},
  switchDepartment: () => {},
  loading: true,
});

export const useDepartment = () => useContext(DepartmentContext);

export const DepartmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userDepartments, setUserDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentIdState] = useState<string | null>(() => {
    return localStorage.getItem('selected_department_id');
  });
  const [loading, setLoading] = useState(true);

  // Fetch all departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('[DepartmentContext] Failed to fetch departments:', error);
        } else {
          setDepartments(data || []);
        }
      } catch (err) {
        console.error('[DepartmentContext] Error fetching departments:', err);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch user-specific departments based on role
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setUserDepartments([]);
      setLoading(false);
      return;
    }

    const fetchUserDepartments = async () => {
      setLoading(true);
      try {
        const isSuperAdmin = user.role === 'super_admin';

        if (isSuperAdmin) {
          // Super admin sees all departments
          const { data, error } = await supabase
            .from('departments')
            .select('id, name')
            .order('name');

          if (!error && data) {
            setUserDepartments(data);
            // Auto-select if only one or if stored value matches
            if (data.length === 1 && !selectedDepartmentId) {
              setSelectedDepartmentIdState(data[0].id);
              localStorage.setItem('selected_department_id', data[0].id);
            }
          }
        } else {
          // Other roles: fetch from user_access joined with departments
          const { data, error } = await supabase
            .from('user_access')
            .select('department_id, departments:department_id(id, name)')
            .eq('user_id', user.id);

          if (!error && data) {
            const depts: Department[] = [];
            const seen = new Set<string>();
            for (const row of data) {
              const dept = row.departments as any;
              if (dept && !seen.has(dept.id)) {
                seen.add(dept.id);
                depts.push({ id: dept.id, name: dept.name });
              }
            }
            depts.sort((a, b) => a.name.localeCompare(b.name));
            setUserDepartments(depts);

            // Auto-select if only one
            if (depts.length === 1 && !selectedDepartmentId) {
              setSelectedDepartmentIdState(depts[0].id);
              localStorage.setItem('selected_department_id', depts[0].id);
            }
          }
        }
      } catch (err) {
        console.error('[DepartmentContext] Error fetching user departments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDepartments();
  }, [isAuthenticated, user?.id, user?.role]);

  const setSelectedDepartmentId = useCallback((id: string | null) => {
    setSelectedDepartmentIdState(id);
    if (id) {
      localStorage.setItem('selected_department_id', id);
    } else {
      localStorage.removeItem('selected_department_id');
    }
  }, []);

  const switchDepartment = useCallback((id: string) => {
    setSelectedDepartmentIdState(id);
    localStorage.setItem('selected_department_id', id);
    // Clear cache so data is refetched for new department
    unifiedDataService.clearCache();
    console.log('[DepartmentContext] Switched department to:', id);
  }, []);

  const selectedDepartment = (userDepartments.length > 0 ? userDepartments : departments)
    .find(d => d.id === selectedDepartmentId) || null;

  return (
    <DepartmentContext.Provider value={{
      departments,
      userDepartments,
      selectedDepartmentId,
      selectedDepartment,
      setSelectedDepartmentId,
      switchDepartment,
      loading,
    }}>
      {children}
    </DepartmentContext.Provider>
  );
};
