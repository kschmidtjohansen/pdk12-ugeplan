
export interface Car {
  id: string;
  name: string;
  car_number: string;
  number_plate: string;
  fuel_card_code: string;
  is_available: boolean;
  has_trailer_hitch?: boolean;
  show_in_planner?: boolean;
  notes?: string;
  towing_capacity_with_brakes?: number | null;
  towing_capacity_without_brakes?: number | null;
  total_weight?: number | null;
  created_at?: string;
  updated_at?: string;
}
