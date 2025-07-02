
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
      
      console.log('[useEmployeeData] USER ROLES FIX - Starting employee fetch...');
      
      // Fetch profiles first
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      
      if (profilesError) {
        console.error('[useEmployeeData] USER ROLES FIX - Profiles fetch error:', profilesError);
        throw profilesError;
      }
      
      if (!profiles || profiles.length === 0) {
        console.log('[useEmployeeData] USER ROLES FIX - No profiles found');
        setEmployees([]);
        return;
      }
      
      console.log(`[useEmployeeData] USER ROLES FIX - Found ${profiles.length} profiles`);
      
      // Fetch user roles with enhanced validation
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.error('[useEmployeeData] USER ROLES FIX - User roles fetch error:', rolesError);
        throw rolesError;
      }
      
      console.log(`[useEmployeeData] USER ROLES FIX - Found ${userRoles?.length || 0} user roles`);
      
      // Validate and create role mapping with enhanced checks
      const rolesMap = new Map<string, string>();
      const roleDistribution: Record<string, number> = {};
      const duplicateCheck = new Map<string, string[]>();
      
      userRoles?.forEach(userRole => {
        // Track duplicates for validation
        if (!duplicateCheck.has(userRole.user_id)) {
          duplicateCheck.set(userRole.user_id, []);
        }
        duplicateCheck.get(userRole.user_id)!.push(userRole.role);
        
        // Set role (last one wins if duplicates exist)
        rolesMap.set(userRole.user_id, userRole.role);
        
        // Track distribution
        roleDistribution[userRole.role] = (roleDistribution[userRole.role] || 0) + 1;
      });
      
      // Log potential issues
      duplicateCheck.forEach((roles, userId) => {
        if (roles.length > 1) {
          const profile = profiles.find(p => p.id === userId);
          console.warn(`[useEmployeeData] USER ROLES FIX - User ${profile?.name || userId} has multiple roles:`, roles);
        }
      });
      
      console.log('[useEmployeeData] USER ROLES FIX - Role distribution:', roleDistribution);
      
      // Transform data with proper role mapping and validation
      const transformedEmployees: Employee[] = profiles.map(profile => {
        const role = rolesMap.get(profile.id) || 'servicemedarbejder';
        
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
        
        return employee;
      });
      
      // Enhanced logging for administrators and skadeledere
      const administrators = transformedEmployees.filter(emp => emp.role === 'administrator');
      const skadeledere = transformedEmployees.filter(emp => emp.role === 'skadeleder');
      
      console.log('[useEmployeeData] USER ROLES FIX - Administrators:', administrators.map(a => ({ name: a.name, email: a.email })));
      console.log('[useEmployeeData] USER ROLES FIX - Skadeledere:', skadeledere.map(s => ({ name: s.name, email: s.email })));
      
      const eligibleForResponsible = transformedEmployees.filter(emp => 
        emp.role === 'administrator' || emp.role === 'skadeleder'
      );
      
      console.log(`[useEmployeeData] USER ROLES FIX - Total eligible for responsible user: ${eligibleForResponsible.length}`);
      
      // Validation: Ensure only one administrator (should be Kasper)
      if (administrators.length !== 1) {
        console.warn(`[useEmployeeData] USER ROLES FIX - Expected 1 administrator, found ${administrators.length}`);
      }
      
      setEmployees(transformedEmployees);
      
    } catch (err) {
      console.error('[useEmployeeData] USER ROLES FIX - Error:', err);
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
