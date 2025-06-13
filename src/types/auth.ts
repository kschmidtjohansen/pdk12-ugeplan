
import { User as SupabaseUser } from '@supabase/supabase-js';

// Extend Supabase User type to include name property
export interface User extends SupabaseUser {
  name?: string;
  user_metadata: {
    name?: string;
    [key: string]: any;
  };
}

export type UserRole = 'administrator' | 'skadeleder' | 'servicemedarbejder';
