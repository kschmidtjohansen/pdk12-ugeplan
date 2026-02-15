import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { unifiedDataService } from '@/services/data/unifiedDataService';

interface Department {
  id: string;
  name: string;
  warehouse_enabled: boolean;
  duty_enabled: boolean;
  substitute_enabled: boolean;
  chat_enabled: boolean;
  files_enabled: boolean;
}

interface SubDepartmentItem {
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
  isWarehouseEnabled: boolean;
  isDutyEnabled: boolean;
  isSubstituteEnabled: boolean;
  isChatEnabled: boolean;
  isFilesEnabled: boolean;
  isUserInSelectedDepartment: boolean;
  refetchDepartments: () => void;
  // Sub-department selection
  selectedSubDepartmentId: string | null;
  setSelectedSubDepartmentId: (id: string | null) => void;
  userSubDepartments: SubDepartmentItem[];
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
  isSubstituteEnabled: true,
  isChatEnabled: true,
  isFilesEnabled: true,
  isUserInSelectedDepartment: true,
  refetchDepartments: () => {},
  selectedSubDepartmentId: null,
  setSelectedSubDepartmentId: () => {},
  userSubDepartments: [],
});

export const useDepartment = () => useContext(DepartmentContext);

export const DepartmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isDemoMode, effectiveRole } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userDepartments, setUserDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentIdState] = useState<string | null>(() => {
    return localStorage.getItem('selected_department_id');
  });
  const [loading, setLoading] = useState(true);
  const [fetchCounter, setFetchCounter] = useState(0);
  const [userOwnDepartmentIds, setUserOwnDepartmentIds] = useState<Set<string>>(new Set());

  // Sub-department state
  const [selectedSubDepartmentId, setSelectedSubDepartmentIdState] = useState<string | null>(() => {
    return localStorage.getItem('selected_sub_department_id');
  });
  const [userSubDepartments, setUserSubDepartments] = useState<SubDepartmentItem[]>([]);

  const refetchDepartments = useCallback(() => {
    setFetchCounter(c => c + 1);
  }, []);

  // Fetch all departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await supabase
          .from('departments')
          .select('id, name, warehouse_enabled, duty_enabled, substitute_enabled')
          .order('name');

        if (error) {
          console.error('[DepartmentContext] Failed to fetch departments:', error);
        } else {
          setDepartments((data || []).map(d => ({
            id: d.id,
            name: d.name,
            warehouse_enabled: (d as any).warehouse_enabled ?? true,
            duty_enabled: (d as any).duty_enabled ?? true,
            substitute_enabled: (d as any).substitute_enabled ?? true,
            chat_enabled: (d as any).chat_enabled ?? true,
            files_enabled: (d as any).files_enabled ?? true,
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
        const isSuperAdmin = effectiveRole === 'super_admin';

        if (isSuperAdmin) {
          const { data, error } = await supabase
            .from('departments')
          .select('id, name, warehouse_enabled, duty_enabled, substitute_enabled, chat_enabled, files_enabled')
            .order('name');

          const { data: ownAccess } = await supabase
            .from('user_access')
            .select('department_id')
            .eq('user_id', user.id);

          if (ownAccess) {
            setUserOwnDepartmentIds(new Set(ownAccess.map(r => r.department_id)));
          }

          if (!error && data) {
            const mapped = data.map(d => ({
              id: d.id,
              name: d.name,
              warehouse_enabled: (d as any).warehouse_enabled ?? true,
              duty_enabled: (d as any).duty_enabled ?? true,
              substitute_enabled: (d as any).substitute_enabled ?? true,
              chat_enabled: (d as any).chat_enabled ?? true,
              files_enabled: (d as any).files_enabled ?? true,
            }));
            setUserDepartments(mapped);
            if (mapped.length > 0 && !selectedDepartmentId) {
              setSelectedDepartmentIdState(mapped[0].id);
              localStorage.setItem('selected_department_id', mapped[0].id);
            }
          }
        } else {
          const { data, error } = await supabase
            .from('user_access')
            .select('department_id, departments:department_id(id, name, warehouse_enabled, duty_enabled, substitute_enabled, chat_enabled, files_enabled)')
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
                  substitute_enabled: dept.substitute_enabled ?? true,
                  chat_enabled: dept.chat_enabled ?? true,
                  files_enabled: dept.files_enabled ?? true,
                });
              }
            }
            depts.sort((a, b) => a.name.localeCompare(b.name));
            setUserDepartments(depts);

            if (depts.length > 0 && !selectedDepartmentId) {
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
  }, [isAuthenticated, user?.id, effectiveRole, fetchCounter]);

  // Fetch sub-departments when selected department changes
  useEffect(() => {
    if (!selectedDepartmentId || !isAuthenticated || !user?.id) {
      setUserSubDepartments([]);
      setSelectedSubDepartmentIdState(null);
      localStorage.removeItem('selected_sub_department_id');
      return;
    }

    const fetchSubDepartments = async () => {
      try {
        const isSuperAdmin = effectiveRole === 'super_admin';

        if (isSuperAdmin) {
          // Super admins see all sub-departments for the selected department
          const { data } = await supabase
            .from('sub_departments')
            .select('id, name')
            .eq('department_id', selectedDepartmentId)
            .order('name');
          
          const subs = data || [];
          setUserSubDepartments(subs);
          
          // Auto-select stored or first sub-department
          const storedSubId = localStorage.getItem('selected_sub_department_id');
          if (subs.length > 0) {
            const validStored = subs.find(s => s.id === storedSubId);
            const newSubId = validStored ? validStored.id : subs[0].id;
            setSelectedSubDepartmentIdState(newSubId);
            localStorage.setItem('selected_sub_department_id', newSubId);
          } else {
            setSelectedSubDepartmentIdState(null);
            localStorage.removeItem('selected_sub_department_id');
          }
        } else {
          // Regular users: only see sub-departments they have access to
          const { data: accessData } = await supabase
            .from('user_access')
            .select('sub_department_id')
            .eq('user_id', user.id)
            .eq('department_id', selectedDepartmentId)
            .not('sub_department_id', 'is', null);

          const subIds = accessData?.map(a => a.sub_department_id).filter(Boolean) as string[] || [];

          if (subIds.length > 0) {
            const { data: subData } = await supabase
              .from('sub_departments')
              .select('id, name')
              .in('id', subIds)
              .order('name');
            
            const subs = subData || [];
            setUserSubDepartments(subs);
            
            const storedSubId = localStorage.getItem('selected_sub_department_id');
            if (subs.length > 0) {
              const validStored = subs.find(s => s.id === storedSubId);
              const newSubId = validStored ? validStored.id : subs[0].id;
              setSelectedSubDepartmentIdState(newSubId);
              localStorage.setItem('selected_sub_department_id', newSubId);
            } else {
              setSelectedSubDepartmentIdState(null);
              localStorage.removeItem('selected_sub_department_id');
            }
          } else {
            setUserSubDepartments([]);
            setSelectedSubDepartmentIdState(null);
            localStorage.removeItem('selected_sub_department_id');
          }
        }
      } catch (err) {
        console.error('[DepartmentContext] Error fetching sub-departments:', err);
      }
    };

    fetchSubDepartments();
  }, [selectedDepartmentId, isAuthenticated, user?.id, effectiveRole, fetchCounter]);

  const setSelectedDepartmentId = useCallback((id: string | null) => {
    setSelectedDepartmentIdState(id);
    if (id) {
      localStorage.setItem('selected_department_id', id);
    } else {
      localStorage.removeItem('selected_department_id');
    }
  }, []);

  const setSelectedSubDepartmentId = useCallback((id: string | null) => {
    setSelectedSubDepartmentIdState(id);
    if (id) {
      localStorage.setItem('selected_sub_department_id', id);
    } else {
      localStorage.removeItem('selected_sub_department_id');
    }
    // Clear cache and force data refresh when sub-department changes
    unifiedDataService.clearCache();
    if (import.meta.env.DEV) console.log('[DepartmentContext] Sub-department switched to:', id, '- cache cleared');
  }, []);

  const switchDepartment = useCallback((id: string) => {
    setSelectedDepartmentIdState(id);
    localStorage.setItem('selected_department_id', id);
    unifiedDataService.clearCache();
    if (import.meta.env.DEV) console.log('[DepartmentContext] Switched department to:', id);
  }, []);

  const selectedDepartment = (userDepartments.length > 0 ? userDepartments : departments)
    .find(d => d.id === selectedDepartmentId) || null;

  // Feature flags - default true, demo always true
  const isWarehouseEnabled = isDemoMode ? true : (selectedDepartment?.warehouse_enabled ?? true);
  const isDutyEnabled = isDemoMode ? true : (selectedDepartment?.duty_enabled ?? true);
  const isSubstituteEnabled = isDemoMode ? true : (selectedDepartment?.substitute_enabled ?? true);
  const isChatEnabled = isDemoMode ? true : (selectedDepartment?.chat_enabled ?? true);
  const isFilesEnabled = isDemoMode ? true : (selectedDepartment?.files_enabled ?? true);

  // For super_admins: check if they are personally assigned to the selected department
  const isUserInSelectedDepartment = effectiveRole !== 'super_admin'
    ? true
    : (selectedDepartmentId ? userOwnDepartmentIds.has(selectedDepartmentId) : true);

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
      isSubstituteEnabled,
      isChatEnabled,
      isFilesEnabled,
      isUserInSelectedDepartment,
      refetchDepartments,
      selectedSubDepartmentId,
      setSelectedSubDepartmentId,
      userSubDepartments,
    }}>
      {children}
    </DepartmentContext.Provider>
  );
};
