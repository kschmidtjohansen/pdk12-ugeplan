
import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { safeProperty } from '@/utils/dbHelpers';
import { UserRole } from '@/context/AuthContext';

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees from Supabase
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Join profiles with user_roles to get all employee data
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          job_title,
          on_leave,
          notes,
          user_roles!inner (role)
        `)
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const formattedEmployees: Employee[] = data.map(item => ({
          id: item.id,
          name: item.name,
          email: item.email,
          phone: item.phone || '',
          jobTitle: item.job_title || '',
          role: safeProperty(item.user_roles, 'role', 'servicemedarbejder') as UserRole,
          onLeave: item.on_leave || false,
          notes: item.notes || ''
        }));
        
        setEmployees(formattedEmployees);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
      toast({
        title: t('common.error'),
        description: t('employees.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Subscribe to employee changes
  useEffect(() => {
    const channel = supabase
      .channel('employee_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchEmployees(); // Refresh when changes occur
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};
