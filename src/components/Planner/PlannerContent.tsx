
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
  // Create adapter functions to match the expected types
  const handleEdit = (assignment: Assignment) => {
    onEditAssignment(assignment);
  };
  
  const handleDelete = (assignment: Assignment) => {
    onDeleteAssignment(assignment.id);
  };
  
  const handlePublish = (assignmentId: string) => {
    onPublishAssignment(assignmentId);
  };

  return (
    <AssignmentList
      date={weekDates.start.toISOString().split('T')[0]} // Use the start date of the week
      assignments={weekAssignments}
      canManage={true}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onPublish={handlePublish}
      onPublishDay={onPublishDay}
      onCreateAssignment={onCreateAssignment}
      selectedWeek={selectedWeek}
      selectedYear={selectedYear}
      weekDates={weekDates}
    />
  );
};

export default PlannerContent;
