
export interface CarData {
  id: string;
  name: string;
  carNumber: string;
  numberPlate: string;
  fuelCardCode: string;
  hasTrailerHitch?: boolean;
}

export type CarFormData = Omit<CarData, 'id'>;
