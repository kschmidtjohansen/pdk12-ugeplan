import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WarehouseIndicator {
  case_number: string;
  count: number;
}

export const useWarehouseIndicators = () => {
  return useQuery({
    queryKey: ['warehouse-indicators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_items')
        .select('case_number')
        .not('case_number', 'is', null);

      if (error) throw error;

      // Count items per case number
      const indicatorMap = new Map<string, number>();
      data?.forEach((item) => {
        if (item.case_number) {
          const count = indicatorMap.get(item.case_number) || 0;
          indicatorMap.set(item.case_number, count + 1);
        }
      });

      return indicatorMap;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
