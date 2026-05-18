import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { da } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/context/TranslationContext';
import { Separator } from '@/components/ui/separator';

interface StatusTimelineProps {
  assignmentId: string;
}

interface LogRow {
  id: string;
  operation: string;
  changed_by_name: string;
  change_details: any;
  created_at: string;
}

const getDotColor = (op: string): string => {
  const o = (op || '').toUpperCase();
  if (o === 'CREATE' || o === 'CREATED') return 'bg-amber-400';
  if (o === 'UPDATE' || o === 'UPDATED') return 'bg-blue-500';
  if (o === 'PUBLISH' || o === 'PUBLISHED') return 'bg-primary';
  if (o === 'COMPLETE' || o === 'COMPLETED') return 'bg-emerald-500';
  if (o === 'DELETE' || o === 'DELETED') return 'bg-destructive';
  return 'bg-muted-foreground';
};


const StatusTimeline: React.FC<StatusTimelineProps> = ({ assignmentId }) => {
  const { t, currentLanguage } = useTranslation();

  const getLabel = (op: string): string => {
    const o = (op || '').toUpperCase().replace(/D$/, '');
    const key = ['CREATE', 'UPDATE', 'PUBLISH', 'DELETE', 'COMPLETE'].includes(o) ? o : null;
    return key ? t(`changeLog.operations.${key}`) : op;
  };

  const { data, isLoading } = useQuery({
    queryKey: ['planner_change_log', assignmentId],
    queryFn: async (): Promise<LogRow[]> => {
      const { data, error } = await supabase
        .from('planner_change_log')
        .select('id, operation, changed_by_name, change_details, created_at')
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data || []) as LogRow[];
    },
    staleTime: 60_000,
    enabled: !!assignmentId,
  });

  if (isLoading) {
    return (
      <>
        <Separator className="my-2" />
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('changeLog.history')}
          </h4>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!data || data.length === 0) return null;

  const locale = currentLanguage === 'da' ? da : undefined;

  return (
    <>
      <Separator className="my-2" />
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t('changeLog.history')}
        </h4>
        <ol className="relative border-l border-border ml-2 space-y-4 pl-4">
          {data.map((row) => (
            <li key={row.id} className="relative">
              <span
                className={`absolute -left-[22px] top-1.5 h-3 w-3 rounded-full ring-2 ring-background ${getDotColor(row.operation)}`}
              />
              <div className="text-sm text-foreground">
                <span className="font-medium">{getLabel(row.operation)}</span>
                {row.changed_by_name && (
                  <span className="text-muted-foreground"> · {row.changed_by_name}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(row.created_at), { addSuffix: true, locale })}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
};

export default StatusTimeline;
