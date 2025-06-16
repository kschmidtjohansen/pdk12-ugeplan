
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
  canPublish: boolean;
  onEdit: (assignment: Assignment) => void;
  onDelete: () => void;
  onPublish?: () => void;
  onCopy?: () => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  cars,
  canEdit,
  canPublish,
  onEdit,
  onDelete,
  onPublish,
  onCopy
}) => {
  // DEBUGGING: Log assignment data received by the card
  console.log(`[AssignmentCard] Rendering assignment card for ${assignment.title || assignment.location}:`);
  console.log(`  - Assignment ID: ${assignment.id}`);
  console.log(`  - Title (case number): ${assignment.title}`);
  console.log(`  - Location: ${assignment.location}`);
  console.log(`  - Assignment object:`, assignment);
  console.log(`  - Employees array:`, assignment.employees);
  console.log(`  - Employees length:`, assignment.employees?.length || 0);
  console.log(`  - Employees type:`, typeof assignment.employees);
  console.log(`  - Is employees array:`, Array.isArray(assignment.employees));
  console.log(`  - Published status:`, assignment.published);
  
  if (assignment.employees && Array.isArray(assignment.employees)) {
    assignment.employees.forEach((emp, index) => {
      console.log(`    - Employee ${index}: "${emp}" (type: ${typeof emp})`);
    });
  } else {
    console.log(`    - No valid employees array found`);
  }

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
          onEdit={() => onEdit(assignment)}
          onDelete={onDelete}
          onPublish={onPublish}
          onCopy={onCopy}
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
