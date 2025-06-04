
import { Assignment } from '@/types/assignment';

// Utility functions to handle car data in assignments
export const getCarIds = (car: Assignment['car']): string[] => {
  if (!car) return [];
  
  if (typeof car === 'string') return [car];
  if (Array.isArray(car)) {
    if (car.length === 0) return [];
    if (typeof car[0] === 'string') return car as string[];
    return (car as { id: string; name: string }[]).map(c => c.id);
  }
  
  // Single car object
  return [(car as { id: string; name: string }).id];
};

export const getCarNames = (car: Assignment['car']): string[] => {
  if (!car) return [];
  
  if (typeof car === 'string') return [car];
  if (Array.isArray(car)) {
    if (car.length === 0) return [];
    if (typeof car[0] === 'string') return car as string[];
    return (car as { id: string; name: string }[]).map(c => c.name);
  }
  
  // Single car object
  return [(car as { id: string; name: string }).name];
};

export const getFirstCarId = (car: Assignment['car']): string | null => {
  const ids = getCarIds(car);
  return ids.length > 0 ? ids[0] : null;
};

export const getFirstCarName = (car: Assignment['car']): string | null => {
  const names = getCarNames(car);
  return names.length > 0 ? names[0] : null;
};

export const getCarDisplayText = (car: Assignment['car']): string => {
  const names = getCarNames(car);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return names.join(', ');
};

export const hasMultipleCars = (car: Assignment['car']): boolean => {
  return getCarIds(car).length > 1;
};
