import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/context/AuthContext';

type Log = (msg: string) => void;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Unknown error');

export interface UserUpdates { name?: string; phone?: string; jobTitle?: string; role?: UserRole; roles?: UserRole[] }

async function invoke<T = unknown>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/** Admin user mutations. All are blocked in demo mode (read-only). */
export function createAdminUserService(isDemoMode: boolean, log: Log) {
  const guard = (action: string) => {
    if (isDemoMode) throw new Error(`Demo mode is read-only. Cannot ${action}.`);
  };

  return {
    async create(userData: Record<string, unknown>) {
      guard('create users');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      log('Attempting to create user...');
      try {
        const data = await invoke('admin-create-user', userData);
        log('User created via edge function');
        return data;
      } catch (err) {
        log(`Edge function create failed: ${errMsg(err)}`);
        throw new Error('User creation via edge function failed. Please try again or contact support.');
      }
    },

    async update(userId: string, updates: UserUpdates) {
      guard('update users');
      log(`Updating user ${userId}...`);
      try {
        const { error } = await supabase.from('profiles').update({
          name: updates.name,
          phone: updates.phone,
          job_title: updates.jobTitle,
        }).eq('id', userId);
        if (error) throw error;
        // Client-side writes to user_roles are blocked by RLS — go via service-role function.
        if (Array.isArray(updates.roles) && updates.roles.length > 0) {
          await invoke('admin-user-role', { userId, roles: Array.from(new Set(updates.roles)) });
        } else if (updates.role) {
          await invoke('admin-user-role', { userId, role: updates.role });
        }
        log('User updated successfully');
        return { success: true };
      } catch (err) {
        log(`User update failed: ${errMsg(err)}`);
        throw err;
      }
    },

    async remove(userId: string) {
      guard('delete users');
      log(`Deleting user ${userId}...`);
      try {
        const data = await invoke('admin-user-delete', { userId });
        log('User deleted via edge function');
        return data;
      } catch (err) {
        log(`Edge function delete failed: ${errMsg(err)}`);
        try {
          const { error } = await supabase.from('profiles').delete().eq('id', userId);
          if (error) throw error;
          log('User deleted via fallback method');
          return { success: true };
        } catch (fallbackErr) {
          log(`Fallback delete failed: ${errMsg(fallbackErr)}`);
          throw new Error('User deletion failed. The user may have associated data that prevents deletion.');
        }
      }
    },

    async setStatus(userId: string, active: boolean) {
      guard('change user status');
      log(`Toggling user ${userId} status to ${active ? 'active' : 'inactive'}...`);
      try {
        const data = await invoke('admin-user-status', { userId, active });
        log('User status toggled via edge function');
        return data;
      } catch (err) {
        log(`Edge function status toggle failed: ${errMsg(err)}`);
        throw new Error('User status toggle failed. This requires admin authentication access.');
      }
    },
  };
}
