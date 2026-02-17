
import { Assignment } from '@/types/assignment';

export const useCarDataHandler = () => {
  // Transform car data for database operations
  const transformCarForDatabase = (assignment: Partial<Assignment>) => {
    // Create a new object with database-compatible properties
    const databasePayload: any = {
      ...assignment,
      car_id: null,
      car_ids: null
    };

    // Handle car field transformation - prioritize cars array over single car
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      databasePayload.car_ids = assignment.cars.filter(id => id && id.trim() !== '');
      databasePayload.car_id = databasePayload.car_ids[0] || null;
    } else if (!assignment.car || assignment.car === '') {
      databasePayload.car_id = null;
      databasePayload.car_ids = null;
    } else if (typeof assignment.car === 'string') {
      databasePayload.car_id = assignment.car;
      databasePayload.car_ids = [assignment.car];
    } else if (assignment.car && typeof assignment.car === 'object' && 'id' in assignment.car) {
      databasePayload.car_id = assignment.car.id;
      databasePayload.car_ids = [assignment.car.id];
    }

    // Remove the original car and cars fields for database operations
    delete databasePayload.car;
    delete databasePayload.cars;

    return databasePayload;
  };

  return {
    transformCarForDatabase
  };
};
