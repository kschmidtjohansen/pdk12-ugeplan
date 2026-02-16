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

export class SecureProfileService {
  
  static async getProfile(profileId: string): Promise<SecureProfile | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_profile_with_role', { profile_id: profileId });

      if (error) {
        logAccessAttempt('profiles', false, { profileId, error: error.message });
        if (import.meta.env.DEV) console.error('Error fetching profile:', error);
        return null;
      }

      if (!data || data.length === 0) {
        logAccessAttempt('profiles', false, { profileId, reason: 'no_data_or_unauthorized' });
        return null;
      }

      logAccessAttempt('profiles', true, { profileId });
      return data[0] as SecureProfile;
    } catch (error) {
      logAccessAttempt('profiles', false, { profileId, error: error instanceof Error ? error.message : 'Unknown error' });
      if (import.meta.env.DEV) console.error('Error in getProfile:', error);
      return null;
    }
  }

  static async getProfiles(): Promise<SecureProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`id, name, email, phone, job_title, status, avatar_url, user_roles(role)`);

      if (error) {
        logAccessAttempt('profiles', false, { operation: 'SELECT_ALL', error: error.message });
        if (import.meta.env.DEV) console.error('Error fetching profiles:', error);
        return [];
      }

      if (!data || data.length === 0) {
        if (import.meta.env.DEV) console.warn('[SecureProfileService] No profiles returned - check permissions');
        return [];
      }

      logAccessAttempt('profiles', true, { operation: 'SELECT_ALL', count: data?.length || 0 });
      
      return data.map(profile => ({
        ...profile,
        role: Array.isArray(profile.user_roles) && profile.user_roles.length > 0 
          ? profile.user_roles[0].role 
          : 'servicemedarbejder'
      })) as SecureProfile[];
    } catch (error) {
      logAccessAttempt('profiles', false, { operation: 'SELECT_ALL', error: error instanceof Error ? error.message : 'Unknown error' });
      if (import.meta.env.DEV) console.error('Error in getProfiles:', error);
      return [];
    }
  }

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
        if (import.meta.env.DEV) console.error('Error updating profile:', error);
        return false;
      }

      logAccessAttempt('profiles', true, { profileId, operation: 'UPDATE' });
      return true;
    } catch (error) {
      logAccessAttempt('profiles', false, { profileId, operation: 'UPDATE', error: error instanceof Error ? error.message : 'Unknown error' });
      if (import.meta.env.DEV) console.error('Error in updateProfile:', error);
      return false;
    }
  }
}
