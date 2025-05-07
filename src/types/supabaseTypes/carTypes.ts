
export interface CarRow {
  id: string;
  name: string;
  car_number: string;
  number_plate: string;
  fuel_card_code: string;
  has_trailer_hitch: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarInsert {
  id?: string;
  name: string;
  car_number: string;
  number_plate: string;
  fuel_card_code: string;
  has_trailer_hitch?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CarUpdate {
  id?: string;
  name?: string;
  car_number?: string;
  number_plate?: string;
  fuel_card_code?: string;
  has_trailer_hitch?: boolean;
  created_at?: string;
  updated_at?: string;
}
