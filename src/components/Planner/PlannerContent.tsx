
import React from 'react';
import { Assignment } from '@/types/assignment';
import AssignmentList from './AssignmentList';

interface PlannerContentProps {
  weekAssignments: Assignment[];
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment: (assignmentId: string) => void;
  onPublishDay: () => void;
  onCreateAssignment: (date: string) => void;
  selectedWeek: number;
  selectedYear: number;
  weekDates: ReturnType<typeof import('@/utils/weekDates').getWeekDates>;
}

const PlannerContent: React.FC<PlannerContentProps> = ({
  weekAssignments,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onPublishDay,
  onCreateAssignment,
  selectedWeek,
  selectedYear,
  weekDates
}) => {
  return (
    <AssignmentList
      assignments={weekAssignments}
      onEditAssignment={onEditAssignment}
      onDeleteAssignment={onDeleteAssignment}
      onPublishAssignment={onPublishAssignment}
      onPublishDay={onPublishDay}
      onCreateAssignment={onCreateAssignment}
      selectedWeek={selectedWeek}
      selectedYear={selectedYear}
      weekDates={weekDates}
    />
  );
};

export default PlannerContent;
