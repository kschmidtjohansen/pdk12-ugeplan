
import { useState, useEffect, useCallback } from 'react';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';

export const useEmployeeData = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useEmployeeData] Starting employee fetch...');
      
      // Fetch profiles and roles in a single optimized query
      const { data: profilesWithRoles, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          phone,
          job_title,
          on_leave,
          notes,
          avatar_url,
          user_roles!inner (
            role
          )
        `)
        .order('name', { ascending: true });
      
      if (fetchError) {
        console.error('[useEmployeeData] Fetch error:', fetchError);
        throw fetchError;
      }
      
      if (!profilesWithRoles || profilesWithRoles.length === 0) {
        console.log('[useEmployeeData] No employees found');
        setEmployees([]);
        return;
      }
      
      // Transform data with proper role mapping
      const transformedEmployees: Employee[] = profilesWithRoles.map(profile => {
        // Handle the role properly - user_roles is an array, get the first role
        const userRole = Array.isArray(profile.user_roles) && profile.user_roles.length > 0 
          ? profile.user_roles[0] 
          : null;
        const role = userRole && typeof userRole === 'object' && 'role' in userRole 
          ? userRole.role 
          : 'servicemedarbejder';
        
        const employee = {
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: role as 'administrator' | 'skadeleder' | 'servicemedarbejder',
          onLeave: profile.on_leave || false,
          notes: profile.notes || '',
          avatar_url: profile.avatar_url
        };
        
        console.log(`[useEmployeeData] Employee: ${profile.name} -> Role: ${role}`);
        return employee;
      });
      
      // Debug role distribution
      const roleDistribution = transformedEmployees.reduce((acc, emp) => {
        acc[emp.role] = (acc[emp.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('[useEmployeeData] Role distribution:', roleDistribution);
      
      const eligibleForResponsible = transformedEmployees.filter(emp => 
        emp.role === 'administrator' || emp.role === 'skadeleder'
      );
      
      console.log(`[useEmployeeData] Eligible for responsible user: ${eligibleForResponsible.length}`, 
        eligibleForResponsible.map(e => ({ name: e.name, role: e.role })));
      
      setEmployees(transformedEmployees);
      
    } catch (err) {
      console.error('[useEmployeeData] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      
      toast({
        title: t('common.error') || 'Error',
        description: t('employees.fetchError') || 'Error loading employees',
        variant: 'destructive',
      });
      
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  // Load employees on mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('employee_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        console.log('[useEmployeeData] Profile change detected, refreshing...');
        fetchEmployees();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        console.log('[useEmployeeData] Role change detected, refreshing...');
        fetchEmployees();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};
