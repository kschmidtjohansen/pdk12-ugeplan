
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
  towing_capacity?: number | null;
  total_weight?: number | null;
  created_at?: string;
  updated_at?: string;
}
