
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
      date={weekDates.start.toISOString().split('T')[0]} // Use the start date of the week
      assignments={weekAssignments}
      canManage={true}
      onEdit={onEditAssignment}
      onDelete={onDeleteAssignment}
      onPublish={onPublishAssignment}
      onPublishDay={onPublishDay}
      onCreateAssignment={onCreateAssignment}
      selectedWeek={selectedWeek}
      selectedYear={selectedYear}
      weekDates={weekDates}
    />
  );
};

export default PlannerContent;
