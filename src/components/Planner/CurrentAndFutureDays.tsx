
import React from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import DaySection from './DaySection';
import VirtualList from './VirtualList';
import { PlannerWidgetErrorBoundary } from '@/components/ErrorBoundary/PlannerWidgetErrorBoundary';

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

  const getYesterdayCount = (dateKey: string): number => {
    const d = new Date(dateKey + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().slice(0, 10);
    return (groupedAssignments[y] || []).length;
  };

  return (
    <VirtualList
      items={dates}
      getKey={(dateKey) => dateKey}
      estimateSize={140}
      gap={24}
      threshold={10}
      renderItem={(dateKey) => (
        <PlannerWidgetErrorBoundary key={dateKey} label={dateKey}>
        <DaySection
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
          selectedIds={selectedIds}
          selectionActive={selectionActive}
          onToggleSelect={onToggleSelect}
        />
        </PlannerWidgetErrorBoundary>
      )}
    />
  );
};

export default CurrentAndFutureDays;
