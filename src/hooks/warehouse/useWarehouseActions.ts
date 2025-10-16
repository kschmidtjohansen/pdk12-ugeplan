import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WarehouseItemFormData } from '@/types/warehouse';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';

export const useWarehouseActions = (onSuccess?: () => void) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const createItem = async (data: WarehouseItemFormData) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('warehouse_items')
        .insert({
          address: data.address,
          case_number: data.case_number || null,
          is_cleaned: data.is_cleaned,
          quantity: data.quantity,
          hall: data.hall || null,
          notes: data.notes || null,
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: t('warehouse.messages.addSuccess'),
      });
      
      onSuccess?.();
    } catch (err) {
      console.error('Error creating warehouse item:', err);
      toast({
        title: t('warehouse.messages.addError'),
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, data: WarehouseItemFormData) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('warehouse_items')
        .update({
          address: data.address,
          case_number: data.case_number || null,
          is_cleaned: data.is_cleaned,
          quantity: data.quantity,
          hall: data.hall || null,
          notes: data.notes || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('warehouse.messages.updateSuccess'),
      });
      
      onSuccess?.();
    } catch (err) {
      console.error('Error updating warehouse item:', err);
      toast({
        title: t('warehouse.messages.updateError'),
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('warehouse_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('warehouse.messages.deleteSuccess'),
      });
      
      onSuccess?.();
    } catch (err) {
      console.error('Error deleting warehouse item:', err);
      toast({
        title: t('warehouse.messages.deleteError'),
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createItem, updateItem, deleteItem, loading };
};
