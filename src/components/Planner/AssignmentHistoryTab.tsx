import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { getSchemaClient } from '@/integrations/supabase/demoSchemaClient';
import { useTranslation } from '@/context/TranslationContext';
import { format } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import type { StatusVariant } from '@/components/ui/status-badge';
import { Assignment } from '@/types/assignment';

interface ChangeLogEntry {
  id: string;
  assignment_id: string | null;
  operation: string;
  changed_by: string;
  changed_by_name: string;
  changed_by_first_name: string | null;
  change_details: any;
  created_at: string;
}

interface AssignmentHistoryTabProps {
  assignment: Assignment;
}

const operationBadgeVariant: Record<string, StatusVariant> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  PUBLISH: 'warning',
};

const fieldLabelMap: Record<string, string> = {
  title: 'Titel',
  location: 'Adresse',
  description: 'Beskrivelse',
  from_time: 'Fra tid',
  to_time: 'Til tid',
  assignment_date: 'Dato',
  car_id: 'Bil',
  published: 'Publiceret',
  employees: 'Medarbejdere',
  case_number: 'Sagsnummer',
  type: 'Type',
  responsible_user_id: 'Sagsansvarlig',
};

function renderChangeSummary(details: any, t: any): React.ReactNode {
  if (!details) return null;

  const changes = details.changes;
  if (!changes || typeof changes !== 'object') {
    // For CREATE/DELETE, show case_number if available
    if (details.case_number) {
      return <span className="text-muted-foreground text-sm">{details.case_number}</span>;
    }
    return null;
  }

  const entries = Object.entries(changes);
  if (entries.length === 0) return null;

  return (
    <ul className="mt-1 space-y-0.5">
      {entries.map(([field, value]: [string, any]) => {
        const label = fieldLabelMap[field] || field;
        if (value && typeof value === 'object' && 'from' in value && 'to' in value) {
          return (
            <li key={field} className="text-xs text-muted-foreground">
              <span className="font-medium">{label}:</span>{' '}
              <span className="line-through opacity-60">{String(value.from ?? '–')}</span>
              {' → '}
              <span>{String(value.to ?? '–')}</span>
            </li>
          );
        }
        // Added/removed arrays (e.g. employees)
        if (value && typeof value === 'object' && ('added' in value || 'removed' in value)) {
          return (
            <li key={field} className="text-xs text-muted-foreground">
              <span className="font-medium">{label}:</span>{' '}
              {value.added?.length > 0 && <span className="text-destructive/70">+{value.added.join(', ')}</span>}
              {value.added?.length > 0 && value.removed?.length > 0 && ' / '}
              {value.removed?.length > 0 && <span className="text-destructive">-{value.removed.join(', ')}</span>}
            </li>
          );
        }
        return (
          <li key={field} className="text-xs text-muted-foreground">
            <span className="font-medium">{label}:</span> {String(value)}
          </li>
        );
      })}
    </ul>
  );
}

const AssignmentHistoryTab: React.FC<AssignmentHistoryTabProps> = ({ assignment }) => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const [logs, setLogs] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = currentLanguage === 'da' ? da : enUS;

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const isDemoMode = user.email === 'test@polygongroup.com';
        const client = getSchemaClient(isDemoMode);

        // Collect all assignment IDs to query (include series siblings)
        let assignmentIds = [assignment.id];

        if (assignment.groupId) {
          const { data: siblings } = await client
            .from('assignments')
            .select('id')
            .eq('group_id', assignment.groupId);

          if (siblings) {
            assignmentIds = [...new Set([...assignmentIds, ...siblings.map((s: any) => s.id)])];
          }
        }

        const { data, error } = await client
          .from('planner_change_log')
          .select('*')
          .in('assignment_id', assignmentIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setLogs((data || []) as ChangeLogEntry[]);
      } catch (error) {
        if (import.meta.env.DEV) console.error('[AssignmentHistoryTab] Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [assignment.id, assignment.groupId, user]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-3 w-3 rounded-full mt-1 shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        {t('planner.history.noEntries')}
      </div>
    );
  }

  return (
    <div className="relative pl-6 py-4 space-y-0">
      {/* Vertical timeline line */}
      <div className="absolute left-[11px] top-6 bottom-6 w-px bg-border" />

      {logs.map((log, index) => {
        const variant = operationBadgeVariant[log.operation] || 'default';
        const operationLabel = t(`planner.history.${log.operation.toLowerCase()}`) || log.operation;
        const userName = log.changed_by_first_name || log.changed_by_name;
        const timestamp = format(new Date(log.created_at), 'dd. MMM yyyy HH:mm', { locale });

        return (
          <div key={log.id} className="relative flex gap-3 pb-5 last:pb-0">
            {/* Timeline dot */}
            <div className="absolute -left-6 mt-1.5">
              <div className={`h-2.5 w-2.5 rounded-full border-2 border-background ${
                variant === 'success' ? 'bg-green-500' :
                variant === 'info' ? 'bg-blue-500' :
                variant === 'error' ? 'bg-red-500' :
                variant === 'warning' ? 'bg-orange-500' :
                'bg-muted-foreground'
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge variant={variant} className="text-[10px] px-1.5 py-0">
                  {operationLabel}
                </StatusBadge>
                <span className="text-xs text-muted-foreground">{timestamp}</span>
              </div>
              <p className="text-sm mt-0.5">
                <span className="font-medium">{userName}</span>
              </p>
              {renderChangeSummary(log.change_details, t)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AssignmentHistoryTab;
