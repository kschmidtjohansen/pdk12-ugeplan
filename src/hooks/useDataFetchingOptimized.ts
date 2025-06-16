
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/TranslationContext';

interface FetchState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export const useDataFetchingOptimized = <T>(
  fetchFunction: () => Promise<T[]>,
  resourceName: string
) => {
  const [state, setState] = useState<FetchState<T>>({
    data: [],
    loading: true,
    error: null
  });
  
  const { toast } = useToast();
  const { t } = useTranslation();
  const isFetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const fetchData = useCallback(async (showToastOnError = false) => {
    if (isFetchingRef.current) {
      console.log(`[${resourceName}] Fetch already in progress, skipping...`);
      return;
    }

    try {
      isFetchingRef.current = true;
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log(`[${resourceName}] Starting fetch...`);
      
      const data = await fetchFunction();
      
      console.log(`[${resourceName}] Successfully fetched ${data.length} items`);
      
      setState({
        data,
        loading: false,
        error: null
      });
      
      retryCountRef.current = 0;
      
    } catch (error) {
      console.error(`[${resourceName}] Fetch error:`, error);
      
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch ${resourceName}`;
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`[${resourceName}] Retrying... (${retryCountRef.current}/${maxRetries})`);
        
        setTimeout(() => {
          fetchData(false);
        }, 1000 * retryCountRef.current);
      } else if (showToastOnError) {
        toast({
          title: t('common.error'),
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [fetchFunction, resourceName, toast, t]);

  const refetch = useCallback(() => {
    retryCountRef.current = 0;
    fetchData(true);
  }, [fetchData]);

  return {
    ...state,
    fetchData,
    refetch,
    isRetrying: retryCountRef.current > 0
  };
};
