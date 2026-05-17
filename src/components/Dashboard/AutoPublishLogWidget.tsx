import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';
import { useAutoPublishLog } from '@/hooks/useAutoPublishLog';

const AutoPublishLogWidget: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useAutoPublishLog(10);

  return (
    <Card className="rounded-xl">
      <CardHeader className="brand-card-header flex flex-row items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-semibold brand-dot">
          {t('dashboard.autoPublishLog.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 rounded-md bg-muted/50 animate-pulse" />
            ))}
          </div>
        )}
        {error && (
          <p className="text-xs text-destructive">{error.message}</p>
        )}
        {!isLoading && !error && (data ?? []).length === 0 && (
          <p className="text-xs text-muted-foreground">
            {t('dashboard.autoPublishLog.empty')}
          </p>
        )}
        {!isLoading && !error && (data ?? []).length > 0 && (
          <ul className="divide-y divide-border">
            {data!.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-foreground">
                  {format(parseISO(entry.run_at), 'dd. MMM HH:mm', { locale: da })}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {t('dashboard.autoPublishLog.assignmentsUpdated', {
                    count: String(entry.assignments_updated),
                  })}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoPublishLogWidget;
