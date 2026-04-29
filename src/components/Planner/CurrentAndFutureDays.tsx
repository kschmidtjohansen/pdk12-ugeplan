
import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import DaySection from './DaySection';

interface CurrentAndFutureDaysProps {
  dates: string[];
  groupedAssignments: Record<string, Assignment[]>;
  allAssignments?: Assignment[];
  operationStates: Record<string, 'publishing' | 'deleting' | 'updating' | null>;
  expandedDays: Record<string, boolean>;
  onToggleExpansion: (date: string) => void;
  onPublishDay?: (date: string) => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onCopyAssignment?: (assignment: Assignment) => void;
  onViewDetails?: (assignment: Assignment) => void;
  onCreateAssignment?: (date: string) => void;
  onCopyDayFromYesterday?: (date: string) => void;
  canEdit: boolean;
  canPublishTasks: boolean;
  cars?: Car[];
  gridLayout?: boolean;
}

const CurrentAndFutureDays: React.FC<CurrentAndFutureDaysProps> = ({
  dates,
  groupedAssignments = {},
  allAssignments = [],
  operationStates,
  expandedDays,
  onToggleExpansion,
  onPublishDay,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onCopyAssignment,
  onViewDetails,
  onCreateAssignment,
  onCopyDayFromYesterday,
  canEdit,
  canPublishTasks,
  cars = [],
  gridLayout = false
}) => {
  if (dates.length === 0) return null;

  // Compute yesterday count from groupedAssignments by walking back one day
  const getYesterdayCount = (dateKey: string): number => {
    const d = new Date(dateKey + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().slice(0, 10);
    return (groupedAssignments[y] || []).length;
  };

  return (
    <div className="space-y-6">
      {dates.map(dateKey => (
        <DaySection 
          key={dateKey}
          dateKey={dateKey}
          dayAssignments={groupedAssignments[dateKey] || []}
          allAssignments={allAssignments}
          isExpanded={expandedDays[dateKey] === true}
          onToggleExpansion={onToggleExpansion}
          onPublishDay={onPublishDay}
          onEditAssignment={onEditAssignment}
          onDeleteAssignment={onDeleteAssignment}
          onPublishAssignment={onPublishAssignment}
          onCopyAssignment={onCopyAssignment}
          onViewDetails={onViewDetails}
          onCreateAssignment={onCreateAssignment}
          onCopyDayFromYesterday={onCopyDayFromYesterday}
          yesterdayCount={getYesterdayCount(dateKey)}
          canEdit={canEdit}
          canPublishTasks={canPublishTasks}
          cars={cars}
          operationStates={operationStates}
          gridLayout={gridLayout}
        />
      ))}
    </div>
  );
};

export default CurrentAndFutureDays;
