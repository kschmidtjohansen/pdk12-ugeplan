import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TABLES_WITH_DEPT = ['assignments', 'cars', 'warehouse_items', 'on_call_duties', 'vacations'] as const;

export const RealtimeChangeNotifier: React.FC = () => {
  const { isDemoMode, user } = useAuth();
  const { selectedDepartmentId } = useDepartment();
  const [hasChanges, setHasChanges] = useState(false);
  const lastOwnAction = useRef<number>(0);
  const deptRef = useRef<string | null>(selectedDepartmentId ?? null);

  useEffect(() => {
    deptRef.current = selectedDepartmentId ?? null;
  }, [selectedDepartmentId]);

  useEffect(() => {
    const handler = () => { lastOwnAction.current = Date.now(); };
    window.addEventListener('supabase-own-action', handler);
    return () => window.removeEventListener('supabase-own-action', handler);
  }, []);

  useEffect(() => {
    if (isDemoMode || !user) return;

    const matchesDept = (payload: any, hasDept: boolean): boolean => {
      const dept = deptRef.current;
      if (!hasDept || !dept) return true;
      const newDept = payload?.new?.department_id ?? null;
      const oldDept = payload?.old?.department_id ?? null;
      // If neither side has dept info, allow through
      if (newDept == null && oldDept == null) return true;
      return newDept === dept || oldDept === dept;
    };

    const handleChange = (payload: any, hasDept: boolean) => {
      if (Date.now() - lastOwnAction.current < 3000) return;
      if (!matchesDept(payload, hasDept)) return;
      setHasChanges(true);
    };

    const channel = supabase.channel('global-change-notifier');
    TABLES_WITH_DEPT.forEach((t) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, (p) => handleChange(p, true));
    });
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (p) => handleChange(p, false));
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isDemoMode, user?.id]);

  if (!hasChanges) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-xs animate-fade-in">
      <div className="flex items-center gap-2 rounded-xl border bg-card text-card-foreground shadow-lg px-3 py-2">
        <RefreshCw className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-medium flex-1 min-w-0">
          Ændringer i denne afdeling
        </span>
        <Button
          size="sm"
          variant="default"
          onClick={() => window.location.reload()}
          className="h-7 text-xs px-2"
        >
          Opdatér
        </Button>
        <button
          onClick={() => setHasChanges(false)}
          className="p-1 hover:bg-muted rounded"
          aria-label="Luk"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
