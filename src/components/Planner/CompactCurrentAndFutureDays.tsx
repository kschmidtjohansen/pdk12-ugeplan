import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import CompactDaySection from './CompactDaySection';
import VirtualList from './VirtualList';
import { PlannerWidgetErrorBoundary } from '@/components/ErrorBoundary/PlannerWidgetErrorBoundary';

interface CompactCurrentAndFutureDaysProps {
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
  onViewAssignmentDetails: (assignment: Assignment) => void;
  canEdit: boolean;
  canPublishTasks: boolean;
  cars?: Car[];
}

const CompactCurrentAndFutureDays: React.FC<CompactCurrentAndFutureDaysProps> = ({
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
  onViewAssignmentDetails,
  canEdit,
  canPublishTasks,
  cars = []
}) => {
  if (dates.length === 0) return null;

  return (
    <VirtualList
      items={dates}
      getKey={(dateKey) => dateKey}
      estimateSize={56}
      gap={12}
      threshold={10}
      renderItem={(dateKey) => (
        <PlannerWidgetErrorBoundary key={dateKey} label={dateKey}>
        <CompactDaySection
          dateKey={dateKey}
          dayAssignments={groupedAssignments[dateKey] || []}
          isExpanded={expandedDays[dateKey] === true}
          onToggleExpansion={onToggleExpansion}
          onPublishDay={onPublishDay}
          onEditAssignment={onEditAssignment}
          onDeleteAssignment={onDeleteAssignment}
          onPublishAssignment={onPublishAssignment}
          onCopyAssignment={onCopyAssignment}
          onViewAssignmentDetails={onViewAssignmentDetails}
          canEdit={canEdit}
          canPublishTasks={canPublishTasks}
          cars={cars}
          operationStates={operationStates}
        />
        </PlannerWidgetErrorBoundary>
      )}
    />
  );
};

export default CompactCurrentAndFutureDays;
