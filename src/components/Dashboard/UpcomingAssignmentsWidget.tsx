
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';

const UpcomingAssignmentsWidget = () => {
  const { t } = useTranslation();
  
  // This is a placeholder component that will be enhanced later
  // for now, it just renders a basic card to fix the build errors
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {t('dashboard.upcomingAssignments')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {t('common.noData')}
        </p>
      </CardContent>
    </Card>
  );
};

export default UpcomingAssignmentsWidget;
