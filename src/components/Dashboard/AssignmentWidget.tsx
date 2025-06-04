
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { MapPin, Clock, Users, Car } from 'lucide-react';
import { getCarDisplayText } from '@/utils/carHelpers';

interface AssignmentWidgetProps {
  assignments: Assignment[];
  showDateFilter?: boolean;
  title?: string;
}

const AssignmentWidget: React.FC<AssignmentWidgetProps> = ({
  assignments,
  showDateFilter = true,
  title
}) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {title || t('admin.todayAssignments')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('dashboard.noAssignments')}
          </p>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-sm">{assignment.location}</h4>
                  </div>
                  <Badge variant={assignment.published ? "default" : "secondary"} className="text-xs">
                    {assignment.published ? t('planner.published') : t('planner.notPublished')}
                  </Badge>
                </div>
                
                {assignment.title && (
                  <p className="text-sm text-gray-600 mb-2">{assignment.title}</p>
                )}
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-gray-700">
                      {assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}
                    </span>
                  </div>
                  
                  {assignment.car && (
                    <div className="flex items-center gap-2">
                      <Car className="h-3 w-3 text-orange-600" />
                      <span className="text-xs text-gray-700">
                        {getCarDisplayText(assignment.car)}
                      </span>
                    </div>
                  )}
                  
                  {assignment.employees && assignment.employees.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-purple-600" />
                      <span className="text-xs text-gray-700">
                        {assignment.employees.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentWidget;
