
import React from 'react';
import { Assignment } from '@/types/assignment';
import DaySection from './DaySection';

interface CurrentAndFutureDaysProps {
  dates: string[];
  groupedAssignments: Record<string, Assignment[]>;
  expandedDays: Record<string, boolean>;
  onToggleExpansion: (date: string) => void;
  onPublishDay?: () => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onCopyAssignment?: (assignment: Assignment) => void;
  canEdit: boolean;
  canPublishTasks: boolean;
}

const CurrentAndFutureDays: React.FC<CurrentAndFutureDaysProps> = ({
  dates,
  groupedAssignments = {}, // Ensure this is initialized
  expandedDays,
  onToggleExpansion,
  onPublishDay,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onCopyAssignment,
  canEdit,
  canPublishTasks
}) => {
  if (dates.length === 0) return null;
  
  return (
    <div className="space-y-6">
      {dates.map(dateKey => (
        <DaySection 
          key={dateKey}
          dateKey={dateKey}
          dayAssignments={groupedAssignments[dateKey] || []} // Ensure we provide an empty array if undefined
          isExpanded={expandedDays[dateKey] !== false} // Default to expanded
          onToggleExpansion={onToggleExpansion}
          onPublishDay={onPublishDay}
          onEditAssignment={onEditAssignment}
          onDeleteAssignment={onDeleteAssignment}
          onPublishAssignment={onPublishAssignment}
          onCopyAssignment={onCopyAssignment}
          canEdit={canEdit}
          canPublishTasks={canPublishTasks}
        />
      ))}
    </div>
  );
};

export default CurrentAndFutureDays;
