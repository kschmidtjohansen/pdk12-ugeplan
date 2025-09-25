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
   * Now uses masked data by default for enhanced security
   * @param fullAccess - Whether to return unmasked sensitive data (requires justification)
   * @param accessReason - Reason for requesting full access (required when fullAccess=true)
   */
  static async getProfiles(fullAccess: boolean = false, accessReason?: string): Promise<SecureProfile[]> {
    try {
      // Validate full access request
      if (fullAccess && !accessReason) {
        throw new Error('Access reason is required when requesting full access to profile data');
      }

      // Use the enhanced security function with masking support
      const { data, error } = await supabase
        .rpc('get_profiles_admin_detailed', { 
          full_access: fullAccess,
          access_reason: accessReason 
        });

      if (error) {
        logAccessAttempt('profiles', false, { 
          operation: 'SELECT_ALL', 
          error: error.message,
          fullAccess,
          accessReason 
        });
        console.error('Error fetching profiles:', error);
        return [];
      }

      // If no data is returned, it could mean:
      // 1. No profiles exist, or 
      // 2. User doesn't have permission (RLS blocked access)
      if (!data || data.length === 0) {
        console.warn('[SecureProfileService] No profiles returned - check permissions');
        return [];
      }

      logAccessAttempt('profiles', true, { 
        operation: 'SELECT_ALL', 
        count: data?.length || 0,
        fullAccess,
        accessReason: fullAccess ? accessReason : 'masked_access'
      });
      
      // Transform the data to match SecureProfile interface  
      return data.map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.email, // Will be masked unless fullAccess=true
        phone: profile.phone, // Will be masked unless fullAccess=true
        job_title: profile.job_title,
        status: profile.status,
        avatar_url: profile.avatar_url,
        role: 'servicemedarbejder' // Default role, need to get from user_roles separately
      })) as SecureProfile[];
    } catch (error) {
      logAccessAttempt('profiles', false, { 
        operation: 'SELECT_ALL', 
        error: error instanceof Error ? error.message : 'Unknown error',
        fullAccess,
        accessReason 
      });
      console.error('Error in getProfiles:', error);
      return [];
    }
  }

  /**
   * Get profiles with full access (unmasked sensitive data)
   * This method requires explicit justification and logs high-priority access
   */
  static async getProfilesFullAccess(accessReason: string): Promise<SecureProfile[]> {
    if (!accessReason || accessReason.trim().length < 10) {
      throw new Error('Valid access reason (minimum 10 characters) is required for full profile access');
    }

    return this.getProfiles(true, accessReason);
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