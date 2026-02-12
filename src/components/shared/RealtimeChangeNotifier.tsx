import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WATCHED_TABLES = ['assignments', 'cars', 'warehouse_items', 'profiles', 'on_call_duties', 'vacations'];

export const RealtimeChangeNotifier: React.FC = () => {
  const { isDemoMode, user } = useAuth();
  const [hasChanges, setHasChanges] = useState(false);
  const lastOwnAction = useRef<number>(0);

  // Track own actions: suppress notifications for 3 seconds after own mutations
  useEffect(() => {
    const handler = () => { lastOwnAction.current = Date.now(); };
    window.addEventListener('supabase-own-action', handler);
    return () => window.removeEventListener('supabase-own-action', handler);
  }, []);

  useEffect(() => {
    if (isDemoMode || !user) return;

    const channel = supabase
      .channel('global-change-notifier')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, handleChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cars' }, handleChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_items' }, handleChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'on_call_duties' }, handleChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacations' }, handleChange)
      .subscribe();

    function handleChange() {
      // Suppress if own action was very recent
      if (Date.now() - lastOwnAction.current < 3000) return;
      setHasChanges(true);
    }

    return () => { supabase.removeChannel(channel); };
  }, [isDemoMode, user?.id]);

  if (!hasChanges) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between shadow-md animate-fade-in">
      <span className="text-sm font-medium">
        Der er sket ændringer. Opdater siden for at se dem.
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => window.location.reload()}
          className="h-7 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Opdater
        </Button>
        <button
          onClick={() => setHasChanges(false)}
          className="p-1 hover:bg-primary-foreground/20 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
