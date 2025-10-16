import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WarehouseIndicator {
  count: number;
  totalQuantity: number;
}

export const useWarehouseIndicators = () => {
  return useQuery({
    queryKey: ['warehouse-indicators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_items')
        .select('case_number, quantity')
        .not('case_number', 'is', null);

      if (error) throw error;

      // Count items per case number and sum quantities
      const indicatorMap = new Map<string, WarehouseIndicator>();
      data?.forEach((item) => {
        if (item.case_number) {
          const current = indicatorMap.get(item.case_number) || { count: 0, totalQuantity: 0 };
          indicatorMap.set(item.case_number, {
            count: current.count + 1,
            totalQuantity: current.totalQuantity + (item.quantity || 0)
          });
        }
      });

      return indicatorMap;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
