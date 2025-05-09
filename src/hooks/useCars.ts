
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData, CarFormData } from '@/components/Cars/types';
import { supabase } from '@/integrations/supabase/client';

export const useCars = () => {
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCar, setCurrentCar] = useState<CarData | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CarFormData>({
    name: '',
    car_number: '',
    number_plate: '',
    fuel_card_code: '',
    has_trailer_hitch: false,
  });
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch cars from Supabase
  const fetchCars = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setCars(data || []);
    } catch (err) {
      console.error('Error fetching cars:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cars');
      toast({
        title: t('common.error'),
        description: t('common.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load cars on component mount
  useEffect(() => {
    fetchCars();
  }, []);

  const handleCreateNew = () => {
    setCurrentCar(null);
    setFormData({
      name: '',
      car_number: '',
      number_plate: '',
      fuel_card_code: '',
      has_trailer_hitch: false,
    });
    setDialogOpen(true);
  };

  const handleEdit = (car: CarData) => {
    setCurrentCar(car);
    setFormData({
      name: car.name,
      car_number: car.car_number,
      number_plate: car.number_plate,
      fuel_card_code: car.fuel_card_code,
      has_trailer_hitch: car.has_trailer_hitch || false,
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
        
        if (error) throw error;
        
        setCars(cars.filter(car => car.id !== currentCar.id));
        
        toast({
          title: t('cars.vehicleDeleted'),
          description: t('cars.vehicleDeletedMsg', { name: currentCar.name }),
        });
      } catch (err) {
        console.error('Error deleting car:', err);
        toast({
          title: t('common.error'),
          description: err instanceof Error ? err.message : 'Error deleting vehicle',
          variant: 'destructive',
        });
      } finally {
        setDeleteDialogOpen(false);
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
        // Update existing car
        const { error } = await supabase
          .from('cars')
          .update({
            name: formData.name,
            car_number: formData.car_number,
            number_plate: formData.number_plate,
            fuel_card_code: formData.fuel_card_code,
            has_trailer_hitch: formData.has_trailer_hitch,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentCar.id);

        if (error) throw error;
        
        // Update local state
        setCars(
          cars.map((c) =>
            c.id === currentCar.id ? { ...c, ...formData, updated_at: new Date().toISOString() } : c
          )
        );
        
        toast({
          title: t('cars.vehicleUpdated'),
          description: t('cars.vehicleUpdatedMsg', { name: formData.name }),
        });
      } else {
        // Create new car
        const { data, error } = await supabase
          .from('cars')
          .insert([
            {
              name: formData.name,
              car_number: formData.car_number,
              number_plate: formData.number_plate,
              fuel_card_code: formData.fuel_card_code,
              has_trailer_hitch: formData.has_trailer_hitch,
            }
          ])
          .select();

        if (error) throw error;
        
        if (data && data.length > 0) {
          // Add new car to local state
          setCars([...cars, data[0]]);
          
          toast({
            title: t('cars.vehicleAdded'),
            description: t('cars.vehicleAddedMsg', { name: formData.name }),
          });
        }
      }
      
      setDialogOpen(false);
    } catch (err) {
      console.error('Error saving car:', err);
      toast({
        title: t('common.error'),
        description: err instanceof Error ? err.message : 'Error saving vehicle',
        variant: 'destructive',
      });
    }
  };

  return {
    cars,
    loading,
    error,
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
