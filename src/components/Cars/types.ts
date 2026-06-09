
export interface CarData {
  id: string;
  name: string;
  car_number: string;
  number_plate: string;
  fuel_card_code: string | null;
  has_trailer_hitch?: boolean;
  is_available: boolean;
  show_in_planner?: boolean;
  is_auxiliary?: boolean;
  notes?: string | null;
  towing_capacity_with_brakes?: number | null;
  towing_capacity_without_brakes?: number | null;
  total_weight?: number | null;
  sub_department_id?: string | null;
  sub_department_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export type CarFormData = Omit<CarData, 'id' | 'created_at' | 'updated_at'>;
