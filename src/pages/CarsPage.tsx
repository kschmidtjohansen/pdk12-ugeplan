
import React, { useState } from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { usePermissions } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';

// Import refactored components
import CarsList from '@/components/Cars/CarsList';
import CarFormDialog from '@/components/Cars/CarFormDialog';
import DeleteConfirmDialog from '@/components/Cars/DeleteConfirmDialog';
import { CarData, CarFormData } from '@/components/Cars/types';

// Mock data
const initialCars: CarData[] = [
  {
    id: '1',
    name: 'Van 1',
    carNumber: 'PG-001',
    numberPlate: 'AB 12 345',
    fuelCardCode: '123456',
  },
  {
    id: '2',
    name: 'Van 2',
    carNumber: 'PG-002',
    numberPlate: 'CD 23 456',
    fuelCardCode: '234567',
  },
  {
    id: '3',
    name: 'Truck 3',
    carNumber: 'PG-003',
    numberPlate: 'EF 34 567',
    fuelCardCode: '345678',
  },
  {
    id: '4',
    name: 'Sedan 1',
    carNumber: 'PG-004',
    numberPlate: 'GH 45 678',
    fuelCardCode: '456789',
  },
];

const CarsPage: React.FC = () => {
  const { canViewFuelCardCode, isAdmin } = usePermissions();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [cars, setCars] = useState<CarData[]>(initialCars);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [currentCar, setCurrentCar] = useState<CarData | null>(null);
  const [formData, setFormData] = useState<CarFormData>({
    name: '',
    carNumber: '',
    numberPlate: '',
    fuelCardCode: '',
  });

  const handleCreateNew = () => {
    setCurrentCar(null);
    setFormData({
      name: '',
      carNumber: '',
      numberPlate: '',
      fuelCardCode: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (car: CarData) => {
    // Only administrators can edit cars
    if (!isAdmin) return;
    
    setCurrentCar(car);
    setFormData({
      name: car.name,
      carNumber: car.carNumber,
      numberPlate: car.numberPlate,
      fuelCardCode: car.fuelCardCode,
    });
    setDialogOpen(true);
  };

  const handleDelete = (car: CarData) => {
    // Only administrators can delete cars
    if (!isAdmin) return;
    
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

  return (
    <>
      <PageHeader 
        title={t('cars.title')}
        description={t('cars.description')}
      >
        {isAdmin && (
          <Button 
            onClick={handleCreateNew}
            className="bg-polygon-blue hover:bg-polygon-darkblue"
          >
            <Plus className="mr-2 h-4 w-4" /> {t('cars.addVehicle')}
          </Button>
        )}
      </PageHeader>

      <CarsList 
        cars={cars} 
        canEdit={false} // Now only admins can edit, controlled in the component
        canViewFuelCardCode={canViewFuelCardCode} 
        isAdmin={isAdmin}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CarFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        isEditing={!!currentCar}
        canViewFuelCardCode={canViewFuelCardCode}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        currentCar={currentCar}
        onConfirmDelete={confirmDelete}
      />
    </>
  );
};

export default CarsPage;
