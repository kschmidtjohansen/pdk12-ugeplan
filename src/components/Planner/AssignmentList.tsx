
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import AssignmentCard from './AssignmentCard';
import { Assignment } from '../../types/assignment';
import { GroupedAssignments } from '../../types/assignment';

interface AssignmentListProps {
  groupedAssignments: GroupedAssignments;
  canEdit: boolean;
  onEditAssignment: (assignment: Assignment) => void;
}

const AssignmentList: React.FC<AssignmentListProps> = ({
  groupedAssignments,
  canEdit,
  onEditAssignment
}) => {
  return (
    <>
      {Object.entries(groupedAssignments)
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .map(([date, dateAssignments]) => (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle>
                {new Date(date).toLocaleDateString('da-DK', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dateAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    canEdit={canEdit}
                    onEdit={onEditAssignment}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
    </>
  );
};

export default AssignmentList;
