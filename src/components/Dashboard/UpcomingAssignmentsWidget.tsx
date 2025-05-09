
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { Calendar } from 'lucide-react';

const UpcomingAssignmentsWidget = () => {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {t('dashboard.upcomingAssignments')}
        </CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center py-2">
          {t('common.noData')}
        </p>
      </CardContent>
    </Card>
  );
};

export default UpcomingAssignmentsWidget;
