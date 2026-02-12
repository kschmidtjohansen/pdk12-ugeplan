import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { unifiedDataService } from '@/services/data/unifiedDataService';

interface Department {
  id: string;
  name: string;
  warehouse_enabled: boolean;
  duty_enabled: boolean;
}

interface DepartmentContextType {
  departments: Department[];
  userDepartments: Department[];
  selectedDepartmentId: string | null;
  selectedDepartment: Department | null;
  setSelectedDepartmentId: (id: string | null) => void;
  switchDepartment: (id: string) => void;
  loading: boolean;
  isWarehouseEnabled: boolean;
  isDutyEnabled: boolean;
  refetchDepartments: () => void;
}

const DepartmentContext = createContext<DepartmentContextType>({
  departments: [],
  userDepartments: [],
  selectedDepartmentId: null,
  selectedDepartment: null,
  setSelectedDepartmentId: () => {},
  switchDepartment: () => {},
  loading: true,
  isWarehouseEnabled: true,
  isDutyEnabled: true,
  refetchDepartments: () => {},
});

export const useDepartment = () => useContext(DepartmentContext);

export const DepartmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isDemoMode } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userDepartments, setUserDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentIdState] = useState<string | null>(() => {
    return localStorage.getItem('selected_department_id');
  });
  const [loading, setLoading] = useState(true);
  const [fetchCounter, setFetchCounter] = useState(0);

  const refetchDepartments = useCallback(() => {
    setFetchCounter(c => c + 1);
  }, []);

  // Fetch all departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('id, name, warehouse_enabled, duty_enabled')
          .order('name');

        if (error) {
          console.error('[DepartmentContext] Failed to fetch departments:', error);
        } else {
          setDepartments((data || []).map(d => ({
            id: d.id,
            name: d.name,
            warehouse_enabled: (d as any).warehouse_enabled ?? true,
            duty_enabled: (d as any).duty_enabled ?? true,
          })));
        }
      } catch (err) {
        console.error('[DepartmentContext] Error fetching departments:', err);
      }
    };

    fetchDepartments();
  }, [fetchCounter]);

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
          const { data, error } = await supabase
            .from('departments')
            .select('id, name, warehouse_enabled, duty_enabled')
            .order('name');

          if (!error && data) {
            const mapped = data.map(d => ({
              id: d.id,
              name: d.name,
              warehouse_enabled: (d as any).warehouse_enabled ?? true,
              duty_enabled: (d as any).duty_enabled ?? true,
            }));
            setUserDepartments(mapped);
            if (mapped.length === 1 && !selectedDepartmentId) {
              setSelectedDepartmentIdState(mapped[0].id);
              localStorage.setItem('selected_department_id', mapped[0].id);
            }
          }
        } else {
          const { data, error } = await supabase
            .from('user_access')
            .select('department_id, departments:department_id(id, name, warehouse_enabled, duty_enabled)')
            .eq('user_id', user.id);

          if (!error && data) {
            const depts: Department[] = [];
            const seen = new Set<string>();
            for (const row of data) {
              const dept = row.departments as any;
              if (dept && !seen.has(dept.id)) {
                seen.add(dept.id);
                depts.push({
                  id: dept.id,
                  name: dept.name,
                  warehouse_enabled: dept.warehouse_enabled ?? true,
                  duty_enabled: dept.duty_enabled ?? true,
                });
              }
            }
            depts.sort((a, b) => a.name.localeCompare(b.name));
            setUserDepartments(depts);

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
  }, [isAuthenticated, user?.id, user?.role, fetchCounter]);

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
    unifiedDataService.clearCache();
    console.log('[DepartmentContext] Switched department to:', id);
  }, []);

  const selectedDepartment = (userDepartments.length > 0 ? userDepartments : departments)
    .find(d => d.id === selectedDepartmentId) || null;

  // Feature flags - default true, demo always true
  const isWarehouseEnabled = isDemoMode ? true : (selectedDepartment?.warehouse_enabled ?? true);
  const isDutyEnabled = isDemoMode ? true : (selectedDepartment?.duty_enabled ?? true);

  return (
    <DepartmentContext.Provider value={{
      departments,
      userDepartments,
      selectedDepartmentId,
      selectedDepartment,
      setSelectedDepartmentId,
      switchDepartment,
      loading,
      isWarehouseEnabled,
      isDutyEnabled,
      refetchDepartments,
    }}>
      {children}
    </DepartmentContext.Provider>
  );
};
