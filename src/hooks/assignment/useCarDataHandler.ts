
import { Assignment } from '@/types/assignment';

export const useCarDataHandler = () => {
  // Transform car data for database operations
  const transformCarForDatabase = (assignment: Partial<Assignment>) => {
    console.log('[useCarDataHandler] Transforming car data:', {
      originalCar: assignment.car,
      carType: typeof assignment.car,
      isEmpty: !assignment.car || assignment.car === ''
    });

    const transformedAssignment = { ...assignment };

    // Handle car field transformation
    if (!assignment.car || assignment.car === '') {
      // No car selected - set both fields to null
      transformedAssignment.car_id = null;
      transformedAssignment.car_ids = null;
      console.log('[useCarDataHandler] No car selected, setting car fields to null');
    } else if (typeof assignment.car === 'string') {
      // Car ID provided as string
      transformedAssignment.car_id = assignment.car;
      transformedAssignment.car_ids = [assignment.car];
      console.log('[useCarDataHandler] Car ID provided:', assignment.car);
    } else if (assignment.car && typeof assignment.car === 'object' && 'id' in assignment.car) {
      // Car object provided
      transformedAssignment.car_id = assignment.car.id;
      transformedAssignment.car_ids = [assignment.car.id];
      console.log('[useCarDataHandler] Car object provided, using ID:', assignment.car.id);
    }

    // Remove the original car field for database operations
    delete transformedAssignment.car;

    console.log('[useCarDataHandler] Transformed assignment:', {
      car_id: transformedAssignment.car_id,
      car_ids: transformedAssignment.car_ids
    });

    return transformedAssignment;
  };

  return {
    transformCarForDatabase
  };
};
