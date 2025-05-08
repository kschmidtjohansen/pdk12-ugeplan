
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarFormData } from '@/components/Cars/types';
import { supabase } from '@/integrations/supabase/client';
import { Car } from '@/types/car';
import { InsertCar, UpdateCar } from '@/types/supabase';

export const useCars = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [currentCar, setCurrentCar] = useState<Car | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CarFormData>({
    name: '',
    carNumber: '',
    numberPlate: '',
    fuelCardCode: '',
    hasTrailerHitch: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch cars from Supabase
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('cars')
          .select('*');

        if (error) {
          throw error;
        }

        // Transform car data to match our Car interface
        const transformedCars: Car[] = data.map(car => ({
          ...car,
          brand: '', // These fields are not in the database but are in our interface
          model: '',
          licensePlate: car.number_plate
        }));

        setCars(transformedCars);
      } catch (error) {
        console.error('Error fetching cars:', error);
        toast({
          title: t('common.error'),
          description: t('cars.fetchError'),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCars();
  }, [toast, t]);

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

  const handleEdit = (car: Car) => {
    setCurrentCar(car);
    setFormData({
      name: car.name,
      carNumber: car.car_number,
      numberPlate: car.number_plate,
      fuelCardCode: car.fuel_card_code || '',
      hasTrailerHitch: car.has_trailer_hitch || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = (car: Car) => {
    setCurrentCar(car);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (currentCar) {
      try {
        const { error } = await supabase
          .from('cars')
          .delete()
          .eq('id', currentCar.id);

        if (error) {
          throw error;
        }

        setCars(cars.filter(car => car.id !== currentCar.id));
        toast({
          title: t('cars.vehicleDeleted'),
          description: t('cars.vehicleDeletedMsg', { name: currentCar.name }),
        });
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting car:', error);
        toast({
          title: t('common.error'),
          description: t('cars.deleteError'),
          variant: "destructive",
        });
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepare data for Supabase
      const carData: InsertCar = {
        name: formData.name,
        car_number: formData.carNumber,
        number_plate: formData.numberPlate,
        fuel_card_code: formData.fuelCardCode || null,
        has_trailer_hitch: formData.hasTrailerHitch,
      };

      if (currentCar) {
        // Update existing
        const { data, error } = await supabase
          .from('cars')
          .update(carData)
          .eq('id', currentCar.id)
          .select();

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setCars(
            cars.map((c) =>
              c.id === currentCar.id ? { 
                ...data[0],
                brand: '', // Keep our interface fields
                model: '',
                licensePlate: data[0].number_plate
              } : c
            )
          );
        }

        toast({
          title: t('cars.vehicleUpdated'),
          description: t('cars.vehicleUpdatedMsg', { name: formData.name }),
        });
      } else {
        // Create new
        const { data, error } = await supabase
          .from('cars')
          .insert(carData)
          .select();

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const newCar: Car = {
            ...data[0],
            brand: '', // Add our interface fields
            model: '',
            licensePlate: data[0].number_plate
          };
          setCars([...cars, newCar]);
        }

        toast({
          title: t('cars.vehicleAdded'),
          description: t('cars.vehicleAddedMsg', { name: formData.name }),
        });
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Error submitting car:', error);
      toast({
        title: t('common.error'),
        description: currentCar ? t('cars.updateError') : t('cars.createError'),
        variant: "destructive",
      });
    }
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
    handleSubmit,
    isLoading
  };
};
