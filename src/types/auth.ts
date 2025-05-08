
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

// User roles
export type UserRole = "administrator" | "skadeleder" | "servicemedarbejder";

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
}

// Auth context interface
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
}

// Auth provider props
export interface AuthProviderProps {
  children: React.ReactNode;
}

// Permission interface
export interface Permissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewFuelCardCode: boolean;
  isAdmin: boolean;
  isSkadeleder: boolean;
  isServicemedarbejder: boolean;
  canApproveVacation: boolean;
  canViewAllVacations: boolean;
  canSeeUnpublishedTasks: boolean;
  canPublishTasks: boolean;
  hasRole: (minimumRole: UserRole) => boolean;
}
