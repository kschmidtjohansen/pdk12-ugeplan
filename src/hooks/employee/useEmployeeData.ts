
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
      
      console.log('[useEmployeeData] COMPREHENSIVE FIX - Starting employee fetch...');
      
      // Enhanced query with better error handling
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      
      if (profilesError) {
        console.error('[useEmployeeData] Profiles fetch error:', profilesError);
        throw new Error(`Profiles fetch failed: ${profilesError.message}`);
      }
      
      if (!profiles || profiles.length === 0) {
        console.log('[useEmployeeData] No profiles found');
        setEmployees([]);
        return;
      }
      
      console.log(`[useEmployeeData] Found ${profiles.length} profiles`);
      
      // Enhanced user roles fetch with retry logic
      let userRoles;
      let rolesError;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`[useEmployeeData] Fetching user roles (attempt ${attempt})...`);
        
        const result = await supabase
          .from('user_roles')
          .select('user_id, role');
        
        userRoles = result.data;
        rolesError = result.error;
        
        if (!rolesError && userRoles) {
          console.log(`[useEmployeeData] Successfully fetched ${userRoles.length} user roles`);
          break;
        }
        
        console.warn(`[useEmployeeData] Attempt ${attempt} failed:`, rolesError?.message);
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
      
      if (rolesError) {
        console.error('[useEmployeeData] User roles fetch failed after retries:', rolesError);
        throw new Error(`User roles fetch failed: ${rolesError.message}`);
      }
      
      // Create comprehensive role mapping with validation
      const rolesMap = new Map<string, string>();
      const roleStats = {
        administrator: 0,
        skadeleder: 0,
        servicemedarbejder: 0,
        duplicates: 0,
        missing: 0
      };
      
      const duplicateCheck = new Map<string, string[]>();
      
      userRoles?.forEach(userRole => {
        // Track all roles per user for duplicate detection
        if (!duplicateCheck.has(userRole.user_id)) {
          duplicateCheck.set(userRole.user_id, []);
        }
        duplicateCheck.get(userRole.user_id)!.push(userRole.role);
        
        // Use the role (last one wins if duplicates)
        rolesMap.set(userRole.user_id, userRole.role);
        roleStats[userRole.role as keyof typeof roleStats]++;
      });
      
      // Detect and log issues
      duplicateCheck.forEach((roles, userId) => {
        if (roles.length > 1) {
          roleStats.duplicates++;
          const profile = profiles.find(p => p.id === userId);
          console.warn(`[useEmployeeData] User ${profile?.name || userId} has duplicate roles:`, roles);
        }
      });
      
      console.log('[useEmployeeData] Role statistics:', roleStats);
      
      // Transform data with enhanced validation
      const transformedEmployees: Employee[] = profiles.map(profile => {
        const role = rolesMap.get(profile.id);
        
        if (!role) {
          roleStats.missing++;
          console.warn(`[useEmployeeData] Missing role for user: ${profile.name} (${profile.email})`);
        }
        
        const finalRole = role || 'servicemedarbejder';
        
        const employee: Employee = {
          id: profile.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.phone || '',
          jobTitle: profile.job_title || '',
          role: finalRole as 'administrator' | 'skadeleder' | 'servicemedarbejder',
          onLeave: profile.on_leave || false,
          notes: profile.notes || '',
          avatar_url: profile.avatar_url
        };
        
        return employee;
      });
      
      // Enhanced validation and logging
      const administrators = transformedEmployees.filter(emp => emp.role === 'administrator');
      const skadeledere = transformedEmployees.filter(emp => emp.role === 'skadeleder');
      const servicemedarbejdere = transformedEmployees.filter(emp => emp.role === 'servicemedarbejder');
      
      console.log('[useEmployeeData] COMPREHENSIVE FIX - Final distribution:');
      console.log('- Administrators:', administrators.map(a => ({ name: a.name, email: a.email })));
      console.log('- Skadeledere:', skadeledere.map(s => ({ name: s.name, email: s.email })));
      console.log('- Servicemedarbejdere count:', servicemedarbejdere.length);
      console.log('- Missing roles count:', roleStats.missing);
      console.log('- Duplicate roles count:', roleStats.duplicates);
      
      const eligibleForResponsible = transformedEmployees.filter(emp => 
        emp.role === 'administrator' || emp.role === 'skadeleder'
      );
      
      console.log(`[useEmployeeData] Total eligible for responsible user: ${eligibleForResponsible.length}`);
      eligibleForResponsible.forEach(emp => {
        console.log(`  - ${emp.name} (${emp.role})`);
      });
      
      // Quality assurance checks
      if (administrators.length === 0) {
        console.error('[useEmployeeData] WARNING: No administrators found!');
      }
      
      if (eligibleForResponsible.length === 0) {
        console.error('[useEmployeeData] WARNING: No eligible responsible users found!');
      }
      
      setEmployees(transformedEmployees);
      console.log('[useEmployeeData] Employee data set successfully');
      
    } catch (err) {
      console.error('[useEmployeeData] COMPREHENSIVE FIX - Critical error:', err);
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

  // Enhanced realtime subscription with error handling
  useEffect(() => {
    console.log('[useEmployeeData] Setting up realtime subscriptions...');
    
    const channel = supabase
      .channel('employee_changes_comprehensive')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('[useEmployeeData] Profile change detected:', payload.eventType);
        fetchEmployees();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, (payload) => {
        console.log('[useEmployeeData] Role change detected:', payload.eventType);
        fetchEmployees();
      })
      .subscribe((status) => {
        console.log('[useEmployeeData] Subscription status:', status);
      });
      
    return () => {
      console.log('[useEmployeeData] Cleaning up realtime subscriptions');
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
