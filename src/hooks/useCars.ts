
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { CarData, CarFormData } from '@/components/Cars/types';

export const useCars = () => {
  const [cars, setCars] = useState<CarData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    fetchCars();

    // Set up real-time subscription for car updates
    const carsSubscription = supabase
      .channel('public:cars')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cars' }, 
        fetchCars
      )
      .subscribe();

    return () => {
      carsSubscription.unsubscribe();
    };
  }, []);

  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*');

      if (error) {
        throw error;
      }

      // Transform to application format
      const carsData: CarData[] = data.map(car => ({
        id: car.id,
        name: car.name,
        carNumber: car.car_number || '',
        numberPlate: car.number_plate || '',
        fuelCardCode: car.fuel_card_code || '',
        hasTrailerHitch: car.has_trailer_hitch || false,
      }));

      setCars(carsData);
    } catch (error) {
      console.error("Error fetching cars:", error);
      toast({
        title: t("common.error"),
        description: t("cars.fetchError"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

        toast({
          title: t('cars.vehicleDeleted'),
          description: t('cars.vehicleDeletedMsg', { name: currentCar.name }),
        });
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error("Error deleting car:", error);
        toast({
          title: t("common.error"),
          description: t("cars.deleteError"),
          variant: "destructive"
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
      if (currentCar) {
        // Update existing
        const { error } = await supabase
          .from('cars')
          .update({
            name: formData.name,
            car_number: formData.carNumber,
            number_plate: formData.numberPlate,
            fuel_card_code: formData.fuelCardCode,
            has_trailer_hitch: formData.hasTrailerHitch
          })
          .eq('id', currentCar.id);

        if (error) {
          throw error;
        }

        toast({
          title: t('cars.vehicleUpdated'),
          description: t('cars.vehicleUpdatedMsg', { name: formData.name }),
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('cars')
          .insert({
            name: formData.name,
            car_number: formData.carNumber,
            number_plate: formData.numberPlate,
            fuel_card_code: formData.fuelCardCode,
            has_trailer_hitch: formData.hasTrailerHitch
          });

        if (error) {
          throw error;
        }

        toast({
          title: t('cars.vehicleAdded'),
          description: t('cars.vehicleAddedMsg', { name: formData.name }),
        });
      }
      
      setDialogOpen(false);
      fetchCars();
    } catch (error) {
      console.error("Error saving car:", error);
      toast({
        title: t("common.error"),
        description: currentCar ? t("cars.updateError") : t("cars.createError"),
        variant: "destructive"
      });
    }
  };

  return {
    cars,
    isLoading,
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
    fetchCars
  };
};
