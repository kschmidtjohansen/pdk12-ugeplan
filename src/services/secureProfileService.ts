import { supabase } from '@/integrations/supabase/client';
import { logAccessAttempt } from '@/utils/securityLogger';

export interface SecureProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  avatar_url?: string;
  role?: string;
}

/**
 * Secure profile service that respects the new RLS policies
 * Uses the new get_profile_with_role function for secure access
 */
export class SecureProfileService {
  
  /**
   * Get profile data with proper security checks
   * Uses the database function that enforces access control
   */
  static async getProfile(profileId: string): Promise<SecureProfile | null> {
    try {
      // Use the secure database function
      const { data, error } = await supabase
        .rpc('get_profile_with_role', { profile_id: profileId });

      if (error) {
        logAccessAttempt('profiles', false, { profileId, error: error.message });
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!data || data.length === 0) {
        // This could be either no data or unauthorized access
        // The function returns empty result for unauthorized access
        logAccessAttempt('profiles', false, { profileId, reason: 'no_data_or_unauthorized' });
        return null;
      }

      logAccessAttempt('profiles', true, { profileId });
      return data[0] as SecureProfile;
    } catch (error) {
      logAccessAttempt('profiles', false, { profileId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getProfile:', error);
      return null;
    }
  }

  /**
   * Get multiple profiles (admin/skadeleder only)
   * Now uses the new restrictive RLS policies with automatic audit logging
   */
  static async getProfiles(): Promise<SecureProfile[]> {
    try {
      // The new RLS policies automatically restrict access and log access attempts
      // Only admins/skadeleder will see results due to profiles_admin_access_audited policy
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

      if (error) {
        logAccessAttempt('profiles', false, { operation: 'SELECT_ALL', error: error.message });
        console.error('Error fetching profiles:', error);
        return [];
      }

      // If no data is returned, it could mean:
      // 1. No profiles exist, or 
      // 2. User doesn't have permission (RLS blocked access)
      // The logging is handled automatically by the database policies
      if (!data || data.length === 0) {
        console.warn('[SecureProfileService] No profiles returned - check permissions');
        return [];
      }

      logAccessAttempt('profiles', true, { operation: 'SELECT_ALL', count: data?.length || 0 });
      
      // Transform the data to match SecureProfile interface
      return data.map(profile => ({
        ...profile,
        role: Array.isArray(profile.user_roles) && profile.user_roles.length > 0 
          ? profile.user_roles[0].role 
          : 'servicemedarbejder'
      })) as SecureProfile[];
    } catch (error) {
      logAccessAttempt('profiles', false, { operation: 'SELECT_ALL', error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getProfiles:', error);
      return [];
    }
  }

  /**
   * Update profile with security logging
   */
  static async updateProfile(
    profileId: string, 
    updates: Partial<Omit<SecureProfile, 'role'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profileId);

      if (error) {
        logAccessAttempt('profiles', false, { profileId, operation: 'UPDATE', error: error.message });
        console.error('Error updating profile:', error);
        return false;
      }

      logAccessAttempt('profiles', true, { profileId, operation: 'UPDATE' });
      return true;
    } catch (error) {
      logAccessAttempt('profiles', false, { profileId, operation: 'UPDATE', error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in updateProfile:', error);
      return false;
    }
  }
}