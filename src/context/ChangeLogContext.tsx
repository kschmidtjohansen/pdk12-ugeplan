import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface ChangeLogEntry {
  id: string;
  assignment_id: string | null;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH';
  changed_by: string;
  changed_by_name: string;
  change_details: any;
  created_at: string;
}

interface ChangeLogContextType {
  changeLogs: ChangeLogEntry[];
  unviewedCount: number;
  loading: boolean;
  fetchChangeLogs: () => Promise<void>;
  fetchChangeLogsByDateRange: (startDate: Date, endDate: Date) => Promise<ChangeLogEntry[]>;
  fetchChangeLogsByCaseNumber: (caseNumber: string) => Promise<ChangeLogEntry[]>;
  markAsViewed: () => void;
}

const defaultContext: ChangeLogContextType = {
  changeLogs: [],
  unviewedCount: 0,
  loading: false,
  fetchChangeLogs: async () => {},
  fetchChangeLogsByDateRange: async () => [],
  fetchChangeLogsByCaseNumber: async () => [],
  markAsViewed: () => {}
};

const ChangeLogContext = createContext<ChangeLogContextType>(defaultContext);

export const useChangeLogs = () => useContext(ChangeLogContext);

const LAST_VIEWED_KEY = 'planner-changes-last-viewed';

export const ChangeLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastViewedTime, setLastViewedTime] = useState<string | null>(
    localStorage.getItem(LAST_VIEWED_KEY)
  );

  const fetchChangeLogs = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      
      // Fetch last 50 change logs
      const { data, error } = await supabase
        .from('planner_change_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setChangeLogs((data || []) as ChangeLogEntry[]);
    } catch (error) {
      console.error('[ChangeLogContext] Failed to fetch change logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChangeLogsByDateRange = async (startDate: Date, endDate: Date): Promise<ChangeLogEntry[]> => {
    if (!isAuthenticated || !user) return [];

    try {
      const { data, error } = await supabase
        .from('planner_change_log')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ChangeLogEntry[];
    } catch (error) {
      console.error('[ChangeLogContext] Failed to fetch logs by date range:', error);
      return [];
    }
  };

  const fetchChangeLogsByCaseNumber = async (caseNumber: string): Promise<ChangeLogEntry[]> => {
    if (!isAuthenticated || !user) return [];

    try {
      const { data, error } = await supabase
        .from('planner_change_log')
        .select('*')
        .contains('change_details', { case_number: caseNumber })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ChangeLogEntry[];
    } catch (error) {
      console.error('[ChangeLogContext] Failed to fetch logs by case number:', error);
      return [];
    }
  };

  const markAsViewed = () => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_VIEWED_KEY, now);
    setLastViewedTime(now);
  };

  // Calculate unviewed count
  const unviewedCount = changeLogs.filter(log => {
    if (!lastViewedTime) return true;
    return new Date(log.created_at) > new Date(lastViewedTime);
  }).length;

  // Fetch on mount and when user changes
  useEffect(() => {
    fetchChangeLogs();
  }, [user?.id, isAuthenticated]);

  // Set up real-time subscription
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase
      .channel('planner_change_log_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'planner_change_log'
        },
        (payload) => {
          console.log('[ChangeLogContext] New change log entry:', payload.new);
          setChangeLogs(prev => [payload.new as ChangeLogEntry, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id]);

  return (
    <ChangeLogContext.Provider value={{ changeLogs, unviewedCount, loading, fetchChangeLogs, fetchChangeLogsByDateRange, fetchChangeLogsByCaseNumber, markAsViewed }}>
      {children}
    </ChangeLogContext.Provider>
  );
};
