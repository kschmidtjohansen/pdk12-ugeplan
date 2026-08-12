
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

/**
 * Disambiguate first names within a pool of full names.
 * If a first name is unique in the pool, only the first name is shown.
 * If duplicated, the shortest unique prefix of the last name is appended:
 * "Mette Jensen" + "Mette Larsen" -> "Mette J" / "Mette L"
 * "Mette Jensen" + "Mette Jørgensen" -> "Mette Je" / "Mette Jø"
 */
export const buildFirstNameResolver = (
  allNames: Array<string | { name?: string } | null | undefined>
): ((fullName: string | null | undefined) => string) => {
  const normalized = Array.from(
    new Set(
      (allNames || [])
        .map(n => (typeof n === 'string' ? n : n?.name) || '')
        .map(n => n.trim())
        .filter(Boolean)
    )
  );

  const getFirst = (n: string) => n.split(/\s+/)[0] || n;
  const getLast = (n: string) => {
    const parts = n.split(/\s+/).filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 1] : '';
  };

  // Group by first name (case-insensitive)
  const groups = new Map<string, string[]>();
  for (const full of normalized) {
    const key = getFirst(full).toLowerCase();
    const list = groups.get(key) || [];
    list.push(full);
    groups.set(key, list);
  }

  const display = new Map<string, string>(); // full name -> display

  for (const [, members] of groups) {
    if (members.length <= 1) {
      display.set(members[0], getFirst(members[0]));
      continue;
    }
    // Find the shortest suffix length that makes all members unique
    let length = 1;
    const maxLength = Math.max(...members.map(m => getLast(m).length), 1);
    while (length < maxLength) {
      const prefixes = members.map(m => getLast(m).slice(0, length).toLowerCase());
      if (new Set(prefixes).size === members.length) break;
      length += 1;
    }
    for (const m of members) {
      const last = getLast(m);
      display.set(m, last ? `${getFirst(m)} ${last.slice(0, length)}` : getFirst(m));
    }
  }

  return (fullName) => {
    const name = (fullName || '').trim();
    if (!name) return '';
    return display.get(name) || getFirst(name);
  };
};

/** Convenience one-off variant of {@link buildFirstNameResolver}. */
export const getDisplayFirstName = (
  fullName: string | null | undefined,
  allNames: Array<string | { name?: string } | null | undefined>
): string => buildFirstNameResolver(allNames)(fullName);
