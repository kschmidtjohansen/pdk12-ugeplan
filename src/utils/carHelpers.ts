
import { Assignment } from '@/types/assignment';

// Helper function to get car display text from assignment
export const getCarDisplayText = (car: Assignment['car']): string | null => {
  if (!car) return null;
  
  if (Array.isArray(car)) {
    if (car.length === 0) return null;
    if (car.length === 1) {
      const singleCar = car[0];
      return typeof singleCar === 'string' ? singleCar : singleCar?.name || null;
    }
    return car.map(c => typeof c === 'string' ? c : c?.name || '').filter(Boolean).join(', ');
  }
  
  return typeof car === 'string' ? car : car?.name || null;
};

// Helper function to get car ID from assignment
export const getCarId = (car: Assignment['car']): string | null => {
  if (!car) return null;
  
  if (Array.isArray(car)) {
    if (car.length === 0) return null;
    const firstCar = car[0];
    return typeof firstCar === 'string' ? firstCar : firstCar?.id || null;
  }
  
  return typeof car === 'string' ? car : car?.id || null;
};

// Helper function to get all car IDs from assignment
export const getAllCarIds = (car: Assignment['car']): string[] => {
  if (!car) return [];
  
  if (Array.isArray(car)) {
    return car.map(c => typeof c === 'string' ? c : c?.id || '').filter(Boolean);
  }
  
  const carId = typeof car === 'string' ? car : car?.id || '';
  return carId ? [carId] : [];
};
