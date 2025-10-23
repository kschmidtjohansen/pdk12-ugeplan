import { useState, useEffect } from 'react';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { supabase } from '@/integrations/supabase/client';
import { WarehouseItem } from '@/types/warehouse';
import { useAuth } from '@/context/AuthContext';

export const useWarehouseData = () => {
  const { isDemoMode } = useAuth();
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = getSchemaClient(isDemoMode);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await client
        .from('warehouse_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setItems((data || []) as any);
    } catch (err) {
      console.error('Error fetching warehouse items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    // Subscribe to real-time changes with schema awareness
    const schema = isDemoMode ? 'demo' : 'public';
    const channel = supabase
      .channel(`warehouse_items_changes_${schema}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: schema,
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
  }, [isDemoMode]);

  return { items, loading, error, refetch: fetchItems };
};
