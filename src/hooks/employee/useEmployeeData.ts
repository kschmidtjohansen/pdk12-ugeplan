
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
      
      // Then get all roles for these users
      if (profilesData && profilesData.length > 0) {
        const userIds = profilesData.map(profile => profile.id);
        
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);
        
        if (rolesError) throw rolesError;
        
        console.log("Roles data:", rolesData);
        
        // Combine the data - REMOVED vacation checking from here
        const formattedEmployees: Employee[] = profilesData.map(item => {
          // Find the role for this user
          const userRole = rolesData?.find(r => r.user_id === item.id);
          
          return {
            id: item.id,
            name: item.name,
            email: item.email,
            phone: item.phone || '',
            jobTitle: item.job_title || '',
            role: userRole ? userRole.role as UserRole : 'servicemedarbejder',
            onLeave: item.on_leave || false, // Only use manual on_leave status
            notes: item.notes || '',
            onApprovedVacation: false, // Will be calculated date-specifically when needed
            avatar_url: item.avatar_url || undefined
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
