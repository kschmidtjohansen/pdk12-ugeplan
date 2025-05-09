
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData, CarFormData } from '@/components/Cars/types';

// Mock data
const initialCars: CarData[] = [
  {
    id: '1',
    name: 'Van 1',
    carNumber: 'PG-001',
    numberPlate: 'AB 12 345',
    fuelCardCode: '123456',
    hasTrailerHitch: true,
  },
  {
    id: '2',
    name: 'Van 2',
    carNumber: 'PG-002',
    numberPlate: 'CD 23 456',
    fuelCardCode: '234567',
    hasTrailerHitch: false,
  },
  {
    id: '3',
    name: 'Truck 3',
    carNumber: 'PG-003',
    numberPlate: 'EF 34 567',
    fuelCardCode: '345678',
    hasTrailerHitch: true,
  },
  {
    id: '4',
    name: 'Sedan 1',
    carNumber: 'PG-004',
    numberPlate: 'GH 45 678',
    fuelCardCode: '456789',
    hasTrailerHitch: false,
  },
];

export const useCars = () => {
  const [cars, setCars] = useState<CarData[]>(initialCars);
  const [currentCar, setCurrentCar] = useState<CarData | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CarFormData>({
    name: '',
    carNumber: '',
    numberPlate: '',
    fuelCardCode: '',
    hasTrailerHitch: false,
  });
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleCreateNew = () => {
    setCurrentCar(null);
    setFormData({
      name: '',
      carNumber: '',
      numberPlate: '',
      fuelCardCode: '',
      hasTrailerHitch: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = (car: CarData) => {
    setCurrentCar(car);
    setFormData({
      name: car.name,
      carNumber: car.carNumber,
      numberPlate: car.numberPlate,
      fuelCardCode: car.fuelCardCode,
      hasTrailerHitch: car.hasTrailerHitch || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = (car: CarData) => {
    setCurrentCar(car);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (currentCar) {
      setCars(cars.filter(car => car.id !== currentCar.id));
      toast({
        title: t('cars.vehicleDeleted'),
        description: t('cars.vehicleDeletedMsg', { name: currentCar.name }),
      });
      setDeleteDialogOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentCar) {
      // Update existing
      setCars(
        cars.map((c) =>
          c.id === currentCar.id ? { ...c, ...formData } : c
        )
      );
      toast({
        title: t('cars.vehicleUpdated'),
        description: t('cars.vehicleUpdatedMsg', { name: formData.name }),
      });
    } else {
      // Create new
      const newCar: CarData = {
        ...formData,
        id: Date.now().toString(),
      };
      setCars([...cars, newCar]);
      toast({
        title: t('cars.vehicleAdded'),
        description: t('cars.vehicleAddedMsg', { name: formData.name }),
      });
    }
    
    setDialogOpen(false);
  };

  return {
    cars,
    currentCar,
    formData,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleCreateNew,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleInputChange,
    handleCheckboxChange,
    handleSubmit
  };
};
