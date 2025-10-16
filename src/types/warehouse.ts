export interface WarehouseItem {
  id: string;
  address: string;
  case_number: string | null;
  is_cleaned: 'ja' | 'nej' | 'ikke_noedvendigt';
  quantity: number;
  notes: string | null;
  hall: 'hal_1' | 'sort_hal' | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface WarehouseItemFormData {
  address: string;
  case_number?: string;
  is_cleaned: 'ja' | 'nej' | 'ikke_noedvendigt';
  quantity: number;
  hall?: 'hal_1' | 'sort_hal';
  notes?: string;
}
