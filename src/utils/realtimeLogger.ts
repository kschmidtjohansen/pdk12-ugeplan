import { supabase } from '@/integrations/supabase/client';

export const logRealtimeChange = async (
  tableName: string,
  operation: string,
  recordId: string
) => {
  try {
    // Use throttled logging to prevent spam
    await supabase.rpc('log_realtime_change_throttled', {
      table_name: tableName,
      operation: operation,
      record_id: recordId
    });
  } catch (error) {
    // Fail silently to prevent blocking realtime operations
    console.warn('[RealtimeLogger] Failed to log realtime change:', error);
  }
};