import type React from 'react';

/** Form state is owned by useEmployeeFormState; re-exported here for the dialog parts. */
export type { EmployeeFormData } from '@/hooks/employee/useEmployeeFormState';

export type InputChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
