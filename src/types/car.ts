
import { TableCar } from './supabase';

// Extend the TableCar with more explicit naming
export interface Car extends TableCar {}

// Legacy CarData format for backward compatibility with components still using it
export interface CarData {
  id: string;
  name: string;
  carNumber: string;
  numberPlate: string;
  fuelCardCode: string;
  hasTrailerHitch?: boolean;
}

// Utility function to convert between formats
export function convertCarToCarData(car: Car): CarData {
  return {
    id: car.id,
    name: car.name,
    carNumber: car.car_number,
    numberPlate: car.number_plate,
    fuelCardCode: car.fuel_card_code || '',
    hasTrailerHitch: car.has_trailer_hitch
  };
}

export function convertCarDataToCar(carData: CarData): Partial<Car> {
  return {
    id: carData.id,
    name: carData.name,
    car_number: carData.carNumber,
    number_plate: carData.numberPlate,
    fuel_card_code: carData.fuelCardCode,
    has_trailer_hitch: carData.hasTrailerHitch
  };
}
