
import { User as SupabaseUser } from '@supabase/supabase-js';

// Extend the Supabase User type to include name property
export interface User extends SupabaseUser {
  name?: string;
}

export type UserRole = 'administrator' | 'skadeleder' | 'servicemedarbejder';
