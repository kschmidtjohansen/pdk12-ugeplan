import { Droplets, Flame, Sprout, Wrench, type LucideIcon } from 'lucide-react';

/** Icon and translation key for an assignment type (same mapping as Min Dag). */
export const assignmentTypeInfo = (type?: string): { Icon: LucideIcon; key: string } => {
  switch (type) {
    case 'waterDamage': return { Icon: Droplets, key: 'dashboard.assignments.waterDamage' };
    case 'fireDamage': return { Icon: Flame, key: 'dashboard.assignments.fireDamage' };
    case 'mold': return { Icon: Sprout, key: 'dashboard.assignments.mold' };
    default: return { Icon: Wrench, key: 'dashboard.assignments.other' };
  }
};
