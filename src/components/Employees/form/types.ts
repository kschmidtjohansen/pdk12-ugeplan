import type React from 'react';

/** Shape of the employee create/edit form state (owned by the parent page). */
export interface EmployeeFormData {
  name: string;
  email: string;
  password?: string;
  phone: string;
  jobTitle?: string;
  role: string;
  roles?: string[];
  notes?: string;
  home_postcode?: string;
  is_temporary?: boolean;
  expires_at?: string;
  onLeave?: boolean;
  skip_department?: boolean;
  sub_department_id?: string;
  has_asbestos_certificate?: boolean;
  has_pcb_certificate?: boolean;
  has_trailer_license?: boolean;
  has_forklift_license?: boolean;
  [key: string]: unknown;
}

export type InputChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
