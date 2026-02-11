import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Department {
  id: string;
  name: string;
}

interface DepartmentContextType {
  departments: Department[];
  selectedDepartmentId: string | null;
  selectedDepartment: Department | null;
  setSelectedDepartmentId: (id: string | null) => void;
  loading: boolean;
}

const DepartmentContext = createContext<DepartmentContextType>({
  departments: [],
  selectedDepartmentId: null,
  selectedDepartment: null,
  setSelectedDepartmentId: () => {},
  loading: true,
});

export const useDepartment = () => useContext(DepartmentContext);

export const DepartmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentIdState] = useState<string | null>(() => {
    return localStorage.getItem('selected_department_id');
  });
  const [loading, setLoading] = useState(true);

  // Fetch departments on mount
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
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const setSelectedDepartmentId = useCallback((id: string | null) => {
    setSelectedDepartmentIdState(id);
    if (id) {
      localStorage.setItem('selected_department_id', id);
    } else {
      localStorage.removeItem('selected_department_id');
    }
  }, []);

  const selectedDepartment = departments.find(d => d.id === selectedDepartmentId) || null;

  return (
    <DepartmentContext.Provider value={{
      departments,
      selectedDepartmentId,
      selectedDepartment,
      setSelectedDepartmentId,
      loading,
    }}>
      {children}
    </DepartmentContext.Provider>
  );
};
