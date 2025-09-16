import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SecurityManager } from '@/services/securityManager';

/**
 * Hook for fetching data with security-aware error handling
 * Handles new RLS policies and provides user-friendly error messages
 */
export const useSecurityAwareData = <T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHasPermission(true);

    try {
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      const errorMessage = SecurityManager.handleSecurityError(err, 'data fetch');
      setError(errorMessage);
      
      // Check if this is a permission error
      if (errorMessage.includes('permission') || errorMessage.includes('Access to this data is restricted')) {
        setHasPermission(false);
      }
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    hasPermission,
    refetch: fetchData
  };
};

/**
 * Hook for testing current user's security permissions
 */
export const useSecurityPermissions = () => {
  const [permissions, setPermissions] = useState({
    canViewProfiles: false,
    canViewFuelCodes: false,
    isAdmin: false,
    canViewAssignments: false,
    loading: true
  });

  const checkPermissions = useCallback(async () => {
    try {
      // Test various permissions
      const [fuelCodeAccess, adminAccess] = await Promise.all([
        SecurityManager.canViewFuelCodes(),
        SecurityManager.isAdminOrSkadeleder()
      ]);

      // Test profile access by trying to fetch own profile
      let canViewProfiles = false;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .limit(1);
          canViewProfiles = !error;
        }
      } catch {
        canViewProfiles = false;
      }

      // Test assignment access
      let canViewAssignments = false;
      try {
        const { error } = await supabase
          .from('assignments')
          .select('id')
          .limit(1);
        canViewAssignments = !error;
      } catch {
        canViewAssignments = false;
      }

      setPermissions({
        canViewProfiles,
        canViewFuelCodes: fuelCodeAccess,
        isAdmin: adminAccess,
        canViewAssignments,
        loading: false
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissions(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    ...permissions,
    refetchPermissions: checkPermissions
  };
};

/**
 * Hook for secure profile data fetching
 */
export const useSecureProfiles = () => {
  return useSecurityAwareData(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        email,
        phone,
        job_title,
        status,
        avatar_url,
        user_roles(role)
      `);

    if (error) throw error;
    
    return data?.map(profile => ({
      ...profile,
      role: Array.isArray(profile.user_roles) && profile.user_roles.length > 0 
        ? profile.user_roles[0].role 
        : 'servicemedarbejder'
    })) || [];
  });
};

/**
 * Hook for secure car data fetching
 */
export const useSecureCars = () => {
  return useSecurityAwareData(async () => {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  });
};

/**
 * Hook for secure assignment data fetching
 */
export const useSecureAssignments = () => {
  return useSecurityAwareData(async () => {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .order('assignment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  });
};