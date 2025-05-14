
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
      
      // First get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          job_title,
          on_leave,
          notes
        `)
        .order('name');
      
      if (profilesError) throw profilesError;
      
      // Then get all roles for these users
      if (profilesData && profilesData.length > 0) {
        const userIds = profilesData.map(profile => profile.id);
        
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
        
        if (rolesError) throw rolesError;
        
        console.log("Roles data:", rolesData);
        
        // Check if employees have active vacations
        const today = new Date().toISOString().split('T')[0];
        const { data: activeVacations, error: vacationsError } = await supabase
          .from('vacations')
          .select('user_id')
          .eq('status', 'approved')
          .lte('start_date', today)
          .gte('end_date', today);
          
        if (vacationsError) {
          console.error('Error fetching active vacations:', vacationsError);
        }
        
        // Create a set of user IDs who are on vacation
        const employeesOnVacation = new Set(
          activeVacations?.map(vacation => vacation.user_id) || []
        );
        
        // Combine the data
        const formattedEmployees: Employee[] = profilesData.map(item => {
          // Find the role for this user
          const userRole = rolesData?.find(r => r.user_id === item.id);
          
          // Check if employee is on approved vacation
          const isOnApprovedVacation = employeesOnVacation.has(item.id);
          
          // If employee is on approved vacation, they should be marked as on leave
          const onLeave = isOnApprovedVacation || item.on_leave;
          
          return {
            id: item.id,
            name: item.name,
            email: item.email,
            phone: item.phone || '',
            jobTitle: item.job_title || '',
            role: userRole ? userRole.role as UserRole : 'servicemedarbejder',
            onLeave: onLeave || false,
            notes: item.notes || '',
            onApprovedVacation: isOnApprovedVacation || false
          };
        });
        
        setEmployees(formattedEmployees);
      } else {
        setEmployees([]);
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
