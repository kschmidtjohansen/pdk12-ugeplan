
import React from 'react';
import { Card } from '@/components/ui/card';
import { Assignment } from '../../types/assignment';
import { Car } from '../../types/car';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import AssignmentActionButtons from './AssignmentActionButtons';
import AssignmentDetails from './AssignmentDetails';

interface AssignmentCardProps {
  assignment: Assignment;
  cars: Car[];
  canEdit: boolean;
  onEdit: (assignment: Assignment) => void;
  onDelete: () => void;
  onPublish?: () => void;
  onCopy?: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  cars,
  canEdit,
  onEdit,
  onDelete,
  onPublish,
  onCopy
}) => {
  // Enhanced debugging for assignment card
  console.log(`[AssignmentCard] Rendering assignment card for ${assignment.title || assignment.location}:`);
  console.log(`  - Assignment ID: ${assignment.id}`);
  console.log(`  - Title (case number): ${assignment.title}`);
  console.log(`  - Location: ${assignment.location}`);
  console.log(`  - Published status: ${assignment.published}`);
  console.log(`  - onPublish function provided: ${typeof onPublish}`);

  const handleEditClick = (assignment: Assignment) => {
    console.log('[AssignmentCard] Edit clicked for assignment:', assignment.id);
    console.log('[AssignmentCard] Calling onEdit prop function...');
    onEdit(assignment);
  };

  const handleCopyClick = () => {
    if (onCopy) {
      console.log('[AssignmentCard] Copy clicked for assignment:', assignment.id);
      onCopy();
    }
  };

  const handlePublishClick = async () => {
    console.log('[AssignmentCard] ===== PUBLISH CLICKED IN ASSIGNMENT CARD =====');
    console.log('[AssignmentCard] Assignment ID:', assignment.id);
    console.log('[AssignmentCard] Published status:', assignment.published);
    console.log('[AssignmentCard] onPublish function type:', typeof onPublish);
    console.log('[AssignmentCard] onPublish function exists:', !!onPublish);
    
    if (onPublish) {
      console.log('[AssignmentCard] Calling onPublish function...');
      try {
        await onPublish();
        console.log('[AssignmentCard] onPublish function completed');
      } catch (error) {
        console.error('[AssignmentCard] Error in onPublish:', error);
      }
    } else {
      console.error('[AssignmentCard] onPublish function not provided!');
    }
    console.log('[AssignmentCard] ===== PUBLISH CLICK END =====');
  };

  const isPublished = assignment.published === true;

  return (
    <Card className="w-full p-4 bg-white hover:border-polygon-purple transition-colors">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <h3 className="font-medium text-lg">{assignment.title || 'Untitled'}</h3>
            {assignment.location && (
              <p className="text-sm text-gray-600">{assignment.location}</p>
            )}
          </div>
          <AssignmentStatusBadge isPublished={isPublished} />
        </div>
        
        <AssignmentActionButtons 
          assignment={assignment}
          onEdit={handleEditClick}
          onDelete={onDelete}
          onPublish={async (assignmentId: string) => {
            console.log('[AssignmentCard] AssignmentActionButtons onPublish called with ID:', assignmentId);
            console.log('[AssignmentCard] Forwarding to handlePublishClick...');
            await handlePublishClick();
          }}
          onCopy={handleCopyClick}
        />
      </div>
      
      {assignment.description && (
        <p className="text-gray-600 mb-3">{assignment.description}</p>
      )}
      
      <AssignmentDetails assignment={assignment} cars={cars} />
    </Card>
  );
};

export default AssignmentCard;
