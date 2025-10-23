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
      
      if (isDemoMode) {
        // Use demo RPC for demo users
        const { data, error: fetchError } = await supabase.rpc('get_demo_warehouse_items');
        if (fetchError) throw fetchError;
        setItems((data || []) as any);
      } else {
        // Use direct table access for production users
        const { data, error: fetchError } = await client
          .from('warehouse_items')
          .select('*')
          .order('created_at', { ascending: false });

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

  useEffect(() => {
    fetchItems();

    if (isDemoMode) {
      // Demo mode: Use polling instead of realtime
      const pollInterval = setInterval(() => {
        fetchItems();
      }, 45000); // Poll every 45 seconds

      return () => clearInterval(pollInterval);
    } else {
      // Production mode: Use realtime subscriptions
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
  }, [isDemoMode]);

  return { items, loading, error, refetch: fetchItems };
};
