
import { useEffect, useCallback } from 'react';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { WarehouseItem, WarehouseItemFormData } from '@/types/warehouse';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isDemoNonHomeDepartment } from '@/constants/demo';

export const useWarehouseData = () => {
  const { isDemoMode, userDataLoaded, user } = useAuth();
  const { selectedDepartmentId, selectedSubDepartmentId } = useDepartment();
  const client = getSchemaClient(isDemoMode);
  const queryClient = useQueryClient();

  const queryKey = ['warehouse-items', isDemoMode, selectedDepartmentId, selectedSubDepartmentId] as const;

  const fetchItemsFn = async (): Promise<WarehouseItem[]> => {
    if (isDemoMode) {
      if (isDemoNonHomeDepartment(isDemoMode, selectedDepartmentId)) {
        if (import.meta.env.DEV) console.log('[useWarehouseData] Non-home department in demo mode, returning empty');
        return [];
      }

      const { data, error: fetchError } = await supabase.rpc('get_demo_warehouse_items');
      if (fetchError) throw fetchError;

      return (data || []).filter((item: any) =>
        item.case_number?.startsWith('DEMO-') || item.address?.startsWith('Demo')
      ) as any;
    } else {
      let query = client.from('warehouse_items').select('*').eq('is_demo', false);
      if (selectedDepartmentId) {
        query = query.eq('department_id', selectedDepartmentId);
      }
      if (selectedSubDepartmentId) {
        query = query.eq('sub_department_id', selectedSubDepartmentId);
      }
      const { data, error: fetchError } = await query.order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      return (data || []) as any;
    }
  };

  const { data: items = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey,
    queryFn: fetchItemsFn,
    enabled: userDataLoaded && !!user && (isDemoMode || !!selectedDepartmentId),
    staleTime: 5 * 60 * 1000,
  });

  // setItems wrapper for optimistic updates compatibility
  const setItems: React.Dispatch<React.SetStateAction<WarehouseItem[]>> = (updater) => {
    queryClient.setQueryData(queryKey, (old: WarehouseItem[] | undefined) => {
      return typeof updater === 'function' ? (updater as (prev: WarehouseItem[]) => WarehouseItem[])(old || []) : updater;
    });
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
  }, [queryClient]);

  const updateLocalItem = useCallback((id: string, data: WarehouseItemFormData) => {
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, address: data.address, case_number: data.case_number || null, is_cleaned: data.is_cleaned, quantity: data.quantity, hall: data.hall || null, notes: data.notes || null, updated_at: new Date().toISOString() }
        : item
    ));
  }, [queryClient]);

  const deleteLocalItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, [queryClient]);

  // Realtime / polling
  useEffect(() => {
    if (!userDataLoaded || !user) return;

    if (isDemoMode) {
      const pollInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['warehouse-items'] });
      }, 45000);
      return () => clearInterval(pollInterval);
    } else {
      const channel = supabase
        .channel(`warehouse_items_changes_public`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_items' }, () => {
          queryClient.invalidateQueries({ queryKey: ['warehouse-items'] });
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [isDemoMode, userDataLoaded, user?.id, selectedDepartmentId, queryClient]);

  return {
    items,
    setItems,
    loading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch items') : null,
    refetch,
    addLocalItem,
    updateLocalItem,
    deleteLocalItem
  };
};
