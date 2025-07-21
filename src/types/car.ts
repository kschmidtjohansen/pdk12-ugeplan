
export interface Car {
  id: string;
  name: string;
  car_number: string;
  number_plate: string;
  fuel_card_code: string;
  is_available: boolean;
  has_trailer_hitch?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
