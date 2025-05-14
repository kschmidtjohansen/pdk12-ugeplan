
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { CarData } from '@/components/Cars/types';
import { supabase } from '@/integrations/supabase/client';

export const useCarData = () => {
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Fetch cars from Supabase
  const fetchCars = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('car_number', { ascending: true });
      
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
    let isMounted = true;
    
    const loadCars = async () => {
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .order('car_number', { ascending: true });
        
        if (error) throw error;
        
        if (isMounted) {
          setCars(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching cars:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch cars');
          toast({
            title: t('common.error'),
            description: t('common.error'),
            variant: 'destructive',
          });
          setLoading(false);
        }
      }
    };
    
    loadCars();
    
    return () => {
      isMounted = false;
    };
  }, [t, toast]);

  return {
    cars,
    setCars,
    loading,
    error,
    fetchCars,
  };
};
