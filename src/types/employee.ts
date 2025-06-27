
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  role: 'administrator' | 'skadeleder' | 'servicemedarbejder';
  onLeave?: boolean;
  notes?: string;
  avatar_url?: string;
}
