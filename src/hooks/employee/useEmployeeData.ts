
import { useState, useEffect, useRef } from 'react';
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
  const fetchInProgressRef = useRef<boolean>(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch employees from Supabase with improved error handling
  const fetchEmployees = async () => {
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      console.log('[useEmployeeData] Fetch already in progress, skipping duplicate request');
      return;
    }

    try {
      fetchInProgressRef.current = true;
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
        throw new Error(`Failed to fetch employee profiles: ${profilesError.message}`);
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
          console.warn('[useEmployeeData] Error fetching roles, using default roles:', rolesError);
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
            console.warn('[useEmployeeData] Invalid employee data, skipping:', item);
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
          
          console.log('[useEmployeeData] Processed employee:', {
            id: employee.id,
            name: employee.name,
            role: employee.role,
            onLeave: employee.onLeave,
            hasUserRole: !!userRole
          });
          
          return employee;
        }).filter((emp): emp is Employee => emp !== null); // Filter out invalid employees
        
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      
      // Only show toast if translation context is available
      try {
        toast({
          title: t('common.error'),
          description: t('employees.fetchError'),
          variant: 'destructive',
        });
      } catch (toastError) {
        console.warn('[useEmployeeData] Could not show error toast, translation context may not be ready:', toastError);
      }
      
      // Set empty array so UI doesn't break
      setEmployees([]);
      
      // Retry after 3 seconds if it's a network error
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        console.log('[useEmployeeData] Network error detected, retrying in 3 seconds...');
        retryTimeoutRef.current = setTimeout(() => {
          fetchEmployees();
        }, 3000);
      }
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
    
    // Cleanup retry timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Subscribe to employee changes with better error handling
  useEffect(() => {
    let channel: any = null;
    
    try {
      channel = supabase
        .channel('employee_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles'
          },
          (payload) => {
            console.log('[useEmployeeData] Received profile change:', payload);
            // Debounce rapid changes
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            retryTimeoutRef.current = setTimeout(() => {
              fetchEmployees();
            }, 500);
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
            console.log('[useEmployeeData] Received role change:', payload);
            // Debounce rapid changes
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
            retryTimeoutRef.current = setTimeout(() => {
              fetchEmployees();
            }, 500);
          }
        )
        .subscribe((status) => {
          console.log('[useEmployeeData] Subscription status:', status);
        });
    } catch (subscriptionError) {
      console.warn('[useEmployeeData] Error setting up real-time subscription:', subscriptionError);
    }
      
    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (cleanupError) {
          console.warn('[useEmployeeData] Error cleaning up subscription:', cleanupError);
        }
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};
