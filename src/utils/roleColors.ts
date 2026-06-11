// Centraliserede rolle-farver til badges/labels på tværs af appen.
// Skadeleder = lilla, Fugttekniker = blå, Servicemedarbejder = grøn.

export type RoleColorTone = 'purple' | 'blue' | 'green' | 'amber' | 'slate';

export const getRoleTone = (role?: string | null): RoleColorTone => {
  switch (role) {
    case 'super_admin':
      return 'amber';
    case 'administrator':
    case 'skadeleder':
      return 'purple';
    case 'fugttekniker':
      return 'blue';
    case 'servicemedarbejder':
    case 'vikar':
      return 'green';
    default:
      return 'slate';
  }
};

// Tailwind-klasser til "badge"/chip-stil (lyse baggrunde, mørk tekst).
export const getRoleBadgeClass = (role?: string | null): string => {
  switch (getRoleTone(role)) {
    case 'purple':
      return 'bg-purple-50 border-purple-200 text-purple-700';
    case 'blue':
      return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'green':
      return 'bg-green-50 border-green-200 text-green-700';
    case 'amber':
      return 'bg-amber-50 border-amber-200 text-amber-700';
    default:
      return 'bg-slate-50 border-slate-200 text-slate-700';
  }
};

// Rene farveklasser til prikker/indikatorer.
export const getRoleDotClass = (role?: string | null): string => {
  switch (getRoleTone(role)) {
    case 'purple':
      return 'bg-purple-500';
    case 'blue':
      return 'bg-blue-500';
    case 'green':
      return 'bg-green-500';
    case 'amber':
      return 'bg-amber-500';
    default:
      return 'bg-slate-400';
  }
};
