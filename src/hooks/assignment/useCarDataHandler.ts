
import { Assignment } from '@/types/assignment';

export const useCarDataHandler = () => {
  // Transform car data for database operations
  const transformCarForDatabase = (assignment: Partial<Assignment>) => {
    console.log('[useCarDataHandler] Transforming car data:', {
      originalCar: assignment.car,
      carType: typeof assignment.car,
      isEmpty: !assignment.car || assignment.car === ''
    });

    // Create a new object with database-compatible properties
    const databasePayload: any = {
      ...assignment,
      car_id: null,
      car_ids: null
    };

    // Handle car field transformation
    if (!assignment.car || assignment.car === '') {
      // No car selected - set both fields to null
      databasePayload.car_id = null;
      databasePayload.car_ids = null;
      console.log('[useCarDataHandler] No car selected, setting car fields to null');
    } else if (typeof assignment.car === 'string') {
      // Car ID provided as string
      databasePayload.car_id = assignment.car;
      databasePayload.car_ids = [assignment.car];
      console.log('[useCarDataHandler] Car ID provided:', assignment.car);
    } else if (assignment.car && typeof assignment.car === 'object' && 'id' in assignment.car) {
      // Car object provided
      databasePayload.car_id = assignment.car.id;
      databasePayload.car_ids = [assignment.car.id];
      console.log('[useCarDataHandler] Car object provided, using ID:', assignment.car.id);
    }

    // Remove the original car field for database operations
    delete databasePayload.car;

    console.log('[useCarDataHandler] Transformed assignment:', {
      car_id: databasePayload.car_id,
      car_ids: databasePayload.car_ids
    });

    return databasePayload;
  };

  return {
    transformCarForDatabase
  };
};
