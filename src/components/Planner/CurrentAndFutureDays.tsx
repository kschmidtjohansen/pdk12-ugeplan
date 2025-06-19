
import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import DaySection from './DaySection';

interface CurrentAndFutureDaysProps {
  dates: string[];
  groupedAssignments: Record<string, Assignment[]>;
  operationStates: Record<string, 'publishing' | 'deleting' | 'updating' | null>;
  expandedDays: Record<string, boolean>;
  onToggleExpansion: (date: string) => void;
  onPublishDay?: (date: string) => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onCopyAssignment?: (assignment: Assignment) => void;
  canEdit: boolean;
  canPublishTasks: boolean;
  cars?: Car[];
}

const CurrentAndFutureDays: React.FC<CurrentAndFutureDaysProps> = ({
  dates,
  groupedAssignments = {},
  operationStates,
  expandedDays,
  onToggleExpansion,
  onPublishDay,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onCopyAssignment,
  canEdit,
  canPublishTasks,
  cars = []
}) => {
  if (dates.length === 0) return null;
  
  return (
    <div className="space-y-6">
      {dates.map(dateKey => (
        <DaySection 
          key={dateKey}
          dateKey={dateKey}
          dayAssignments={groupedAssignments[dateKey] || []}
          isExpanded={expandedDays[dateKey] !== false}
          onToggleExpansion={onToggleExpansion}
          onPublishDay={onPublishDay}
          onEditAssignment={onEditAssignment}
          onDeleteAssignment={onDeleteAssignment}
          onPublishAssignment={onPublishAssignment}
          onCopyAssignment={onCopyAssignment}
          canEdit={canEdit}
          canPublishTasks={canPublishTasks}
          cars={cars}
          operationStates={operationStates}
        />
      ))}
    </div>
  );
};

export default CurrentAndFutureDays;
