
import React from 'react';
import { Assignment } from '@/types/assignment';
import { WeekDates } from '@/hooks/usePlannerPage';
import { PlannerSkeleton } from './PlannerSkeleton';
import CurrentAndFutureDays from './CurrentAndFutureDays';
import PastAssignments from './PastAssignments';
import UnassignedResourcesSection from './UnassignedResourcesSection';

interface PlannerContentProps {
  weekAssignments: Assignment[];
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (id: string) => void;
  onPublishAssignment: (id: string) => void;
  onPublishDay: (date: string) => void;
  onCreateAssignment: (date: string) => void;
  onCopyAssignment: (assignment: Assignment) => void;
  selectedWeek: number;
  selectedYear: number;
  weekDates: WeekDates | null;
  handleShowOnScreen: () => void;
  isLoading?: boolean;
}

const PlannerContent: React.FC<PlannerContentProps> = ({
  weekAssignments,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onPublishDay,
  onCreateAssignment,
  onCopyAssignment,
  selectedWeek,
  selectedYear,
  weekDates,
  handleShowOnScreen,
  isLoading = false
}) => {
  // Show loading skeleton while data is loading
  if (isLoading) {
    return <PlannerSkeleton />;
  }

  if (!weekDates) {
    return <PlannerSkeleton />;
  }

  // Split assignments into current/future and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentAndFutureAssignments = weekAssignments.filter(assignment => {
    const assignmentDate = new Date(assignment.date);
    assignmentDate.setHours(0, 0, 0, 0);
    return assignmentDate >= today;
  });

  const pastAssignments = weekAssignments.filter(assignment => {
    const assignmentDate = new Date(assignment.date);
    assignmentDate.setHours(0, 0, 0, 0);
    return assignmentDate < today;
  });

  return (
    <div className="space-y-8">
      {/* Current and Future Days */}
      <CurrentAndFutureDays
        assignments={currentAndFutureAssignments}
        weekDates={weekDates}
        onEditAssignment={onEditAssignment}
        onDeleteAssignment={onDeleteAssignment}
        onPublishAssignment={onPublishAssignment}
        onPublishDay={onPublishDay}
        onCreateAssignment={onCreateAssignment}
        onCopyAssignment={onCopyAssignment}
        handleShowOnScreen={handleShowOnScreen}
      />

      {/* Unassigned Resources */}
      <UnassignedResourcesSection 
        assignments={currentAndFutureAssignments}
        weekDates={weekDates}
      />

      {/* Past Assignments */}
      {pastAssignments.length > 0 && (
        <PastAssignments
          assignments={pastAssignments}
          onEditAssignment={onEditAssignment}
          onDeleteAssignment={onDeleteAssignment}
          onPublishAssignment={onPublishAssignment}
          onCopyAssignment={onCopyAssignment}
        />
      )}
    </div>
  );
};

export default PlannerContent;
