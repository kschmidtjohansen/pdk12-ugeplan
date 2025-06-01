
import React from 'react';
import { Card } from '@/components/ui/card';
import { Assignment } from '../../types/assignment';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import AssignmentActionButtons from './AssignmentActionButtons';
import AssignmentDetails from './AssignmentDetails';

interface AssignmentCardProps {
  assignment: Assignment;
  canEdit: boolean;
  onEdit: (assignment: Assignment) => void;
  onDelete: () => void;
  onPublish?: () => void;
  onCopy?: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  canEdit,
  onEdit,
  onDelete,
  onPublish,
  onCopy
}) => {
  const isPublished = assignment.published === true;

  return (
    <Card className="w-full p-4 bg-white hover:border-polygon-purple transition-colors">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-lg">{assignment.location}</h3>
          <AssignmentStatusBadge isPublished={isPublished} />
        </div>
        
        <AssignmentActionButtons 
          assignment={assignment}
          onEdit={() => onEdit(assignment)}
          onDelete={onDelete}
          onPublish={onPublish}
          onCopy={onCopy}
        />
      </div>
      
      <p className="text-gray-600 mb-3">{assignment.description}</p>
      
      <AssignmentDetails assignment={assignment} />
    </Card>
  );
};

export default AssignmentCard;
