/**
 * Demo-mode constants.
 * All demo data is treated as belonging to department 12 - Fredericia.
 * When a different department is selected, demo hooks return empty arrays.
 */
export const DEMO_HOME_DEPARTMENT_ID = '8c542620-9156-4155-b686-564b14a4ca62';

export const isDemoNonHomeDepartment = (
  isDemoMode: boolean,
  selectedDepartmentId: string | null
): boolean => {
  return isDemoMode && !!selectedDepartmentId && selectedDepartmentId !== DEMO_HOME_DEPARTMENT_ID;
};
