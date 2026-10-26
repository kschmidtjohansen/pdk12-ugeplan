export const LEAVE_TYPES = ['Ferie', 'Feriefridag', 'Afspadsering'] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

const SEP = ' – ';

/** Split a stored reason into leave type + free note. Reason format: "<Type>" or "<Type> – <note>". */
export function parseLeaveReason(reason: string): { type: LeaveType | null; note: string } {
  const value = reason ?? '';
  for (const type of [...LEAVE_TYPES].sort((a, b) => b.length - a.length)) {
    if (value === type) return { type, note: '' };
    if (value.startsWith(type + SEP)) return { type, note: value.slice(type.length + SEP.length) };
  }
  return { type: null, note: value };
}

export function buildLeaveReason(type: LeaveType | null, note: string): string {
  const trimmed = note.trim() ? note : '';
  if (!type) return trimmed;
  return trimmed ? `${type}${SEP}${note}` : type;
}
