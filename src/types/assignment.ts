
export interface Assignment {
  id: string;
  title: string;
  description?: string;
  date: string;
  fromTime: string;
  toTime: string;
  location: string;
  type?: string;
  published: boolean;
  responsibleUserId?: string;
  employees?: string[];
  car?: string;
  cars?: string[];
  createdAt?: string;
  updatedAt?: string;
  responsibleUser?: {
    id: string;
    name: string;
  };
}
