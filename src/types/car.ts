
import { TableCar } from './supabase';

export interface Car extends TableCar {
  brand?: string;
  model?: string;
  licensePlate?: string;
}
