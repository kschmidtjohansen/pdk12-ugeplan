
export interface Car {
  id: string;
  name: string;
  car_number: string;
  number_plate: string;
  fuel_card_code: string;
  has_trailer_hitch?: boolean;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}
