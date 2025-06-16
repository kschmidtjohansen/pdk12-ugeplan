import React from 'react';
import { Assignment } from '@/types/assignment';
import { PlannerSkeleton } from './PlannerSkeleton';
import CurrentAndFutureDays from './CurrentAndFutureDays';
import PastAssignments from './PastAssignments';
import UnassignedResourcesSection from './UnassignedResourcesSection';

interface WeekDates {
  start: Date;
  end: Date;
  weekNumber: number;
  year: number;
}

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

  // Group assignments by date for the new component structure
  const groupCurrentAndFutureByDate = () => {
    const grouped: Record<string, Assignment[]> = {};
    currentAndFutureAssignments.forEach(assignment => {
      if (!grouped[assignment.date]) {
        grouped[assignment.date] = [];
      }
      grouped[assignment.date].push(assignment);
    });
    return grouped;
  };

  const groupPastByDate = () => {
    const grouped: Record<string, Assignment[]> = {};
    pastAssignments.forEach(assignment => {
      if (!grouped[assignment.date]) {
        grouped[assignment.date] = [];
      }
      grouped[assignment.date].push(assignment);
    });
    return grouped;
  };

  const currentAndFutureGrouped = groupCurrentAndFutureByDate();
  const pastGrouped = groupPastByDate();

  // Get sorted date keys
  const currentAndFutureDates = Object.keys(currentAndFutureGrouped).sort();
  const pastDates = Object.keys(pastGrouped).sort().reverse(); // Past dates in reverse chronological order

  // Create expanded state (default to expanded for all days)
  const expandedDays: Record<string, boolean> = {};
  [...currentAndFutureDates, ...pastDates].forEach(date => {
    expandedDays[date] = true;
  });

  const handleToggleExpansion = (date: string) => {
    // This would normally update state, but for now we'll keep all expanded
    console.log('Toggle expansion for date:', date);
  };

  return (
    <div className="space-y-8">
      {/* Current and Future Days */}
      <CurrentAndFutureDays
        dates={currentAndFutureDates}
        groupedAssignments={currentAndFutureGrouped}
        expandedDays={expandedDays}
        onToggleExpansion={handleToggleExpansion}
        onPublishDay={() => onPublishDay(new Date().toISOString().split('T')[0])}
        onEditAssignment={onEditAssignment}
        onDeleteAssignment={onDeleteAssignment}
        onPublishAssignment={onPublishAssignment}
        onCopyAssignment={onCopyAssignment}
        canEdit={true}
        canPublishTasks={true}
        cars={[]}
      />

      {/* Past Assignments */}
      {pastDates.length > 0 && (
        <PastAssignments
          pastDates={pastDates}
          groupedAssignments={pastGrouped}
          expandedDays={expandedDays}
          onToggleExpansion={handleToggleExpansion}
          onPublishDay={() => onPublishDay(new Date().toISOString().split('T')[0])}
          onEditAssignment={onEditAssignment}
          onDeleteAssignment={onDeleteAssignment}
          onPublishAssignment={onPublishAssignment}
          onCopyAssignment={onCopyAssignment}
          canEdit={true}
          canPublishTasks={true}
          cars={[]}
        />
      )}
    </div>
  );
};

export default PlannerContent;
