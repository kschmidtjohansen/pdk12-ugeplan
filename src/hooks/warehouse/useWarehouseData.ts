import { useState, useEffect, useCallback } from 'react';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { WarehouseItem, WarehouseItemFormData } from '@/types/warehouse';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';

export const useWarehouseData = () => {
  const { isDemoMode, userDataLoaded, user } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = getSchemaClient(isDemoMode);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isDemoMode) {
        const { data, error: fetchError } = await supabase.rpc('get_demo_warehouse_items');
        if (fetchError) throw fetchError;
        
        const demoItems = (data || []).filter((item: any) => 
          item.case_number?.startsWith('DEMO-') || item.address?.startsWith('Demo')
        );
        
        setItems(demoItems as any);
      } else {
        let query = client
          .from('warehouse_items')
          .select('*');
        
        if (selectedDepartmentId) {
          query = query.eq('department_id', selectedDepartmentId);
        }
        
        const { data, error: fetchError } = await query.order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setItems((data || []) as any);
      }
    } catch (err) {
      console.error('Error fetching warehouse items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  // Local state mutation functions for demo mode persistence
  const addLocalItem = useCallback((data: WarehouseItemFormData) => {
    const newItem: WarehouseItem = {
      id: crypto.randomUUID(),
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
    setItems(prev => [newItem, ...prev]);
  }, []);

  const updateLocalItem = useCallback((id: string, data: WarehouseItemFormData) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            address: data.address,
            case_number: data.case_number || null,
            is_cleaned: data.is_cleaned,
            quantity: data.quantity,
            hall: data.hall || null,
            notes: data.notes || null,
            updated_at: new Date().toISOString(),
          } 
        : item
    ));
  }, []);

  const deleteLocalItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  useEffect(() => {
    if (!userDataLoaded || !user) return;
    
    fetchItems();

    if (isDemoMode) {
      const pollInterval = setInterval(() => {
        fetchItems();
      }, 45000);

      return () => clearInterval(pollInterval);
    } else {
      const channel = supabase
        .channel(`warehouse_items_changes_public`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'warehouse_items'
          },
          () => {
            fetchItems();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isDemoMode, userDataLoaded, user?.id, selectedDepartmentId]);

  return { items, setItems, loading, error, refetch: fetchItems, addLocalItem, updateLocalItem, deleteLocalItem };
};
