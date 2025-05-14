
import React from 'react';
import { Assignment } from '@/types/assignment';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { formatDateWithCapital, getDateStatus } from '@/utils/dateUtils';
import { useTranslation } from '@/context/TranslationContext';
import { Clock, MapPin, Users, Check, X } from 'lucide-react';
import AssignmentActionButtons from './AssignmentActionButtons';

interface AssignmentListProps {
  date: string;
  assignments: Assignment[];
  canManage: boolean;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
  onPublish?: (assignmentId: string) => void;
}

const AssignmentList: React.FC<AssignmentListProps> = ({
  date,
  assignments,
  canManage,
  onEdit,
  onDelete,
  onPublish
}) => {
  const { t, currentLanguage } = useTranslation();
  const formattedDate = formatDateWithCapital(date, currentLanguage);
  const dateStatus = getDateStatus(date);
  
  // Format time to show only hours and minutes (HH:MM)
  const formatTimeWithoutSeconds = (timeString: string) => {
    if (!timeString) return '';
    return timeString.split(':').slice(0, 2).join(':');
  };
  
  // Sort assignments by time
  const sortedAssignments = [...assignments].sort((a, b) => {
    return a.fromTime && b.fromTime ? a.fromTime.localeCompare(b.fromTime) : 0;
  });

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {formattedDate}
          {dateStatus === 'today' && (
            <Badge className="ml-2 bg-blue-500 text-white">
              {t('common.today')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {sortedAssignments.length === 0 ? (
          <div className="text-sm text-gray-500 py-2">
            {t('planner.nothingPlannedToday')}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-3 border rounded-md bg-white"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{assignment.title}</h4>
                  <Badge
                    variant="outline"
                    className={
                      assignment.published
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }
                  >
                    {assignment.published ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    {assignment.published ? t('planner.published') : t('planner.notPublished')}
                  </Badge>
                </div>
                
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    <span>
                      {formatTimeWithoutSeconds(assignment.fromTime)} - {formatTimeWithoutSeconds(assignment.toTime)}
                    </span>
                  </div>
                  
                  {assignment.location && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      <span>{assignment.location}</span>
                    </div>
                  )}
                  
                  <div className="flex items-start text-sm">
                    <Users className="h-4 w-4 mr-1 text-gray-400 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {assignment.employees && assignment.employees.length > 0 ? (
                        assignment.employees.map((employee, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-blue-50">
                            {employee}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">
                          {t('planner.noEmployees')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {canManage && (
                  <div className="mt-3 flex justify-end gap-2">
                    <AssignmentActionButtons
                      assignment={assignment}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onPublish={onPublish}
                      size="xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AssignmentList;
