import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { WarehouseItem, WarehouseItemFormData } from '@/types/warehouse';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useQueryClient } from '@tanstack/react-query';

interface LocalItemHandlers {
  addLocalItem?: (data: WarehouseItemFormData) => void;
  updateLocalItem?: (id: string, data: WarehouseItemFormData) => void;
  deleteLocalItem?: (id: string) => void;
}

interface OptimisticHandlers {
  items: WarehouseItem[];
  setItems: React.Dispatch<React.SetStateAction<WarehouseItem[]>>;
}

export const useWarehouseActions = (onSuccess?: () => void, localHandlers?: LocalItemHandlers, optimistic?: OptimisticHandlers) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDemoMode } = useAuth();
  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();
  const queryClient = useQueryClient();

  const createItem = async (data: WarehouseItemFormData) => {
    try {
      setLoading(true);
      
      if (isDemoMode) {
        const { data: { user } } = await supabase.auth.getUser();
        const client = getSchemaClient(isDemoMode);
        const { error } = await client.from('warehouse_items').insert({
          address: data.address,
          case_number: data.case_number || null,
          is_cleaned: data.is_cleaned,
          quantity: data.quantity,
          hall: data.hall || null,
          notes: data.notes || null,
          created_by: user?.id,
          department_id: selectedDepartmentId || null,
          sub_department_id: selectedSubDepartmentId || null,
          is_demo: true,
        });
        if (error) {
          console.error('Error creating demo warehouse item:', error);
          toast({ title: t('warehouse.messages.addError'), variant: 'destructive' });
          return;
        }
        toast({ title: t('warehouse.messages.addSuccess') });
        queryClient.invalidateQueries({ queryKey: ['warehouse-items'] });
        onSuccess?.();
        return;
      }

      // Optimistic: add temp item to UI immediately
      const tempId = crypto.randomUUID();
      const tempItem: WarehouseItem = {
        id: tempId,
        address: data.address,
        case_number: data.case_number || null,
        is_cleaned: data.is_cleaned,
        quantity: data.quantity,
        hall: data.hall || null,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
      };
      
      if (optimistic) {
        console.log('[Optimistic] Adding temp warehouse item:', tempId);
        optimistic.setItems(prev => [tempItem, ...prev]);
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      const client = getSchemaClient(isDemoMode);
      
      const { error } = await client
        .from('warehouse_items')
        .insert({
          address: data.address,
          case_number: data.case_number || null,
          is_cleaned: data.is_cleaned,
          quantity: data.quantity,
          hall: data.hall || null,
          notes: data.notes || null,
          created_by: user?.id,
          department_id: selectedDepartmentId || null,
          sub_department_id: selectedSubDepartmentId || null
        });

      if (error) {
        // Rollback: remove temp item
        if (optimistic) {
          console.log('[Optimistic] Rollback: removing temp item', tempId);
          optimistic.setItems(prev => prev.filter(i => i.id !== tempId));
        }
        throw error;
      }

      toast({ title: t('warehouse.messages.addSuccess') });
      queryClient.invalidateQueries({ queryKey: ['warehouse-items'] });
      onSuccess?.();
    } catch (err) {
      console.error('Error creating warehouse item:', err);
      toast({ title: t('warehouse.messages.addError'), variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, data: WarehouseItemFormData) => {
    try {
      setLoading(true);
      
      if (isDemoMode) {
        const client = getSchemaClient(isDemoMode);
        const { error } = await client.from('warehouse_items').update({
          address: data.address,
          case_number: data.case_number || null,
          is_cleaned: data.is_cleaned,
          quantity: data.quantity,
          hall: data.hall || null,
          notes: data.notes || null,
        }).eq('id', id);
        if (error) {
          console.error('Error updating demo warehouse item:', error);
          toast({ title: t('warehouse.messages.updateError'), variant: 'destructive' });
          return;
        }
        toast({ title: t('warehouse.messages.updateSuccess') });
        queryClient.invalidateQueries({ queryKey: ['warehouse-items'] });
        onSuccess?.();
        return;
      }

      // Optimistic: update item in UI immediately
      let previousItems: WarehouseItem[] | null = null;
      if (optimistic) {
        previousItems = [...optimistic.items];
        console.log('[Optimistic] Updating warehouse item in UI:', id);
        optimistic.setItems(prev => prev.map(item =>
          item.id === id
            ? { ...item, address: data.address, case_number: data.case_number || null, is_cleaned: data.is_cleaned, quantity: data.quantity, hall: data.hall || null, notes: data.notes || null, updated_at: new Date().toISOString() }
            : item
        ));
      }
      
      const client = getSchemaClient(isDemoMode);
      
      const { error } = await client
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

      if (error) {
        // Rollback
        if (optimistic && previousItems) {
          console.log('[Optimistic] Rollback: restoring warehouse items');
          optimistic.setItems(previousItems);
        }
        throw error;
      }

      toast({ title: t('warehouse.messages.updateSuccess') });
      queryClient.invalidateQueries({ queryKey: ['warehouse-items'] });
      onSuccess?.();
    } catch (err) {
      console.error('Error updating warehouse item:', err);
      toast({ title: t('warehouse.messages.updateError'), variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      setLoading(true);
      
      if (isDemoMode) {
        const client = getSchemaClient(isDemoMode);
        const { error } = await client.from('warehouse_items').delete().eq('id', id);
        if (error) {
          console.error('Error deleting demo warehouse item:', error);
          toast({ title: t('warehouse.messages.deleteError'), variant: 'destructive' });
          return;
        }
        toast({ title: t('warehouse.messages.deleteSuccess') });
        queryClient.invalidateQueries({ queryKey: ['warehouse-items'] });
        onSuccess?.();
        return;
      }

      // Optimistic: remove item from UI immediately
      let previousItems: WarehouseItem[] | null = null;
      if (optimistic) {
        previousItems = [...optimistic.items];
        console.log('[Optimistic] Removing warehouse item from UI:', id);
        optimistic.setItems(prev => prev.filter(item => item.id !== id));
      }
      
      const client = getSchemaClient(isDemoMode);
      
      const { error } = await client
        .from('warehouse_items')
        .delete()
        .eq('id', id);

      if (error) {
        // Rollback
        if (optimistic && previousItems) {
          console.log('[Optimistic] Rollback: restoring warehouse items');
          optimistic.setItems(previousItems);
        }
        throw error;
      }

      toast({ title: t('warehouse.messages.deleteSuccess') });
      queryClient.invalidateQueries({ queryKey: ['warehouse-items'] });
      onSuccess?.();
    } catch (err) {
      console.error('Error deleting warehouse item:', err);
      toast({ title: t('warehouse.messages.deleteError'), variant: 'destructive' });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createItem, updateItem, deleteItem, loading };
};
