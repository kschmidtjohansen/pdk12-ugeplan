
import { Employee } from '@/types/employee';
import { Assignment } from '@/types/assignment';
import { isValidUUID } from './uuidValidation';

// Determine a clean display name for an employee-like input
export const resolveEmployeeDisplayName = (
  emp: { id?: string; name?: string; email?: string } | string | null | undefined,
  employees?: Employee[]
): string => {
  if (!emp) return 'Unknown User';

  // If we received a string, it might be an ID or a name
  if (typeof emp === 'string') {
    const asString = emp.trim();
    // Try to match by ID first
    if (employees && isValidUUID(asString)) {
      const found = employees.find(e => e.id === asString);
      if (found?.name && !isValidUUID(found.name)) return found.name;
    }
    // If it's not an ID, treat it as a name if it doesn't look like a UUID
    if (asString && !isValidUUID(asString)) return asString;
    return 'Unknown User';
  }

  // If we received an object, prioritize: employee list match -> name -> email prefix
  const { id, name, email } = emp;

  if (employees && id) {
    const found = employees.find(e => e.id === id);
    if (found?.name && !isValidUUID(found.name)) return found.name;
  }

  if (name && name.trim() && !isValidUUID(name)) return name.trim();

  if (email && email.includes('@')) return email.split('@')[0];

  return 'Unknown User';
};

// Reconcile an assignment's assignedEmployees to ensure proper display names
export const reconcileAssignmentEmployeeNames = (
  assignment: Assignment,
  employees: Employee[]
): Assignment => {
  const assigned = assignment.assignedEmployees || [];
  const reconciledAssigned = assigned.map(emp => ({
    id: emp.id,
    email: emp.email,
    name: resolveEmployeeDisplayName(emp, employees),
  }));

  return {
    ...assignment,
    assignedEmployees: reconciledAssigned,
  };
};

// Filter names for display: remove Unknown, UUID-like strings, empty, and de-duplicate
export const filterDisplayNames = (names: string[]): string[] => {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const n of names) {
    const name = (n || '').trim();
    if (!name) continue;
    const lower = name.toLowerCase();
    if (lower === 'unknown' || lower === 'unknown user') continue;
    if (isValidUUID(name)) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    cleaned.push(name);
  }

  return cleaned;
};
