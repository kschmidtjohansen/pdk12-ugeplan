export type UserRole = 'super_admin' | 'administrator' | 'skadeleder' | 'servicemedarbejder' | 'fugttekniker' | 'vikar';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;        // Highest-privilege role (derived from roles[])
  roles?: UserRole[];    // All assigned roles
}

export interface ImpersonationTarget {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
}
