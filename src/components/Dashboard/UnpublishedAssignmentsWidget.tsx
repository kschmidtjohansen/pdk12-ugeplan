
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Clock, MapPin } from 'lucide-react';

interface UnpublishedAssignmentsWidgetProps {
  assignments: Assignment[];
}

const UnpublishedAssignmentsWidget: React.FC<UnpublishedAssignmentsWidgetProps> = ({
  assignments
}) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {t('dashboard.unpublishedAssignments')}
        </CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            {t('dashboard.noUnpublishedAssignments')}
          </p>
        ) : (
          <div className="space-y-3">
            {assignments.slice(0, 5).map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                    <MapPin className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{assignment.location}</p>
                    <p className="text-xs text-muted-foreground">{assignment.date}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {t('planner.notPublished')}
                </Badge>
              </div>
            ))}
            {assignments.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{assignments.length - 5} {t('common.more')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnpublishedAssignmentsWidget;
