
import { useState, useEffect } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
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
      
      if (profilesError) {
        console.error('[useEmployeeData] Error fetching profiles:', profilesError);
        throw profilesError;
      }
      
      console.log('[useEmployeeData] Fetched profiles:', profilesData?.length || 0);
      
      // Then get all roles for these users - with better error handling
      let rolesData: any[] = [];
      if (profilesData && profilesData.length > 0) {
        const userIds = profilesData.map(profile => profile.id);
        
        const { data: fetchedRolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
        
        if (rolesError) {
          // Only log role errors in development mode, don't break the flow
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useEmployeeData] Error fetching roles, using default roles:', rolesError);
          }
          // Don't throw error, just use empty array and default roles
          rolesData = [];
        } else {
          rolesData = fetchedRolesData || [];
        }
        
        console.log('[useEmployeeData] Fetched roles:', rolesData.length);
        
        // Combine the data with better error handling
        const formattedEmployees: Employee[] = profilesData.map(item => {
          // Validate required fields
          if (!item.id || typeof item.name !== 'string' || item.name.trim() === '') {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[useEmployeeData] Invalid employee data, skipping:', item);
            }
            return null;
          }
          
          // Find the role for this user, with fallback to default
          const userRole = rolesData.find(r => r.user_id === item.id);
          const defaultRole: UserRole = 'servicemedarbejder';
          
          const employee: Employee = {
            id: item.id,
            name: item.name.trim(),
            email: item.email || '',
            phone: item.phone || '',
            jobTitle: item.job_title || '',
            role: userRole ? userRole.role as UserRole : defaultRole,
            onLeave: item.on_leave || false,
            notes: item.notes || '',
            onApprovedVacation: false, // Will be calculated date-specifically when needed
            avatar_url: item.avatar_url || undefined
          };
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[useEmployeeData] Processed employee:', {
              id: employee.id,
              name: employee.name,
              role: employee.role,
              onLeave: employee.onLeave,
              hasUserRole: !!userRole
            });
          }
          
          return employee;
        }).filter((emp): emp is Employee => emp !== null); // Filter out invalid employees
        
        // Filter and log servicemedarbejder employees specifically
        const serviceEmployees = formattedEmployees.filter(emp => emp.role === 'servicemedarbejder');
        if (process.env.NODE_ENV === 'development') {
          console.log('[useEmployeeData] Service employees (servicemedarbejder role):', serviceEmployees.length);
          serviceEmployees.forEach(emp => {
            console.log(`  - ${emp.name} (${emp.id}) - onLeave: ${emp.onLeave}`);
          });
        }
        
        setEmployees(formattedEmployees);
      } else {
        console.log('[useEmployeeData] No profiles found');
        setEmployees([]);
      }
    } catch (err) {
      console.error('[useEmployeeData] Error fetching employees:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      
      // Show a more user-friendly error message
      toast({
        title: t('common.error'),
        description: t('employees.fetchError'),
        variant: 'destructive',
      });
      
      // Set empty array so UI doesn't break
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Subscribe to employee changes with better error handling
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
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useEmployeeData] Received profile change:', payload);
          }
          fetchEmployees(); // Refresh when changes occur
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useEmployeeData] Received role change:', payload);
          }
          fetchEmployees(); // Refresh when role changes occur
        }
      )
      .subscribe((status) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useEmployeeData] Subscription status:', status);
        }
      });
      
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
