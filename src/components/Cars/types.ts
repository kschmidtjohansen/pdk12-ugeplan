
export interface CarData {
  id: string;
  name: string;
  carNumber: string;
  numberPlate: string;
  fuelCardCode: string;
}

export type CarFormData = Omit<CarData, 'id'>;
