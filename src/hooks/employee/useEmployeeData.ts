
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
      
      console.log('[useEmployeeData] Starting to fetch employees...');
      
      // First get all profiles including avatar_url
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          job_title,
          on_leave,
          notes,
          avatar_url
        `)
        .order('name');
      
      if (profilesError) throw profilesError;
      
      console.log('[useEmployeeData] Fetched profiles:', profilesData?.length || 0);
      
      // Then get all roles for these users
      if (profilesData && profilesData.length > 0) {
        const userIds = profilesData.map(profile => profile.id);
        
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
        
        if (rolesError) throw rolesError;
        
        console.log('[useEmployeeData] Fetched roles:', rolesData?.length || 0);
        console.log('[useEmployeeData] Roles data:', rolesData);
        
        // Combine the data
        const formattedEmployees: Employee[] = profilesData.map(item => {
          // Find the role for this user
          const userRole = rolesData?.find(r => r.user_id === item.id);
          
          const employee: Employee = {
            id: item.id,
            name: item.name,
            email: item.email,
            phone: item.phone || '',
            jobTitle: item.job_title || '',
            role: userRole ? userRole.role as UserRole : 'servicemedarbejder',
            onLeave: item.on_leave || false,
            notes: item.notes || '',
            onApprovedVacation: false, // Will be calculated date-specifically when needed
            avatar_url: item.avatar_url || undefined
          };
          
          console.log('[useEmployeeData] Processed employee:', {
            id: employee.id,
            name: employee.name,
            role: employee.role,
            onLeave: employee.onLeave
          });
          
          return employee;
        });
        
        // Filter and log servicemedarbejder employees specifically
        const serviceEmployees = formattedEmployees.filter(emp => emp.role === 'servicemedarbejder');
        console.log('[useEmployeeData] Service employees (servicemedarbejder role):', serviceEmployees.length);
        serviceEmployees.forEach(emp => {
          console.log(`  - ${emp.name} (${emp.id}) - onLeave: ${emp.onLeave}`);
        });
        
        setEmployees(formattedEmployees);
      } else {
        console.log('[useEmployeeData] No profiles found');
        setEmployees([]);
      }
    } catch (err) {
      console.error('[useEmployeeData] Error fetching employees:', err);
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
          console.log('[useEmployeeData] Received profile change, refreshing...');
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
