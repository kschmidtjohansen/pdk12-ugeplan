
export interface CarData {
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

export type CarFormData = Omit<CarData, 'id' | 'created_at' | 'updated_at'>;
