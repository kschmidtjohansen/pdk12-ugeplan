
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Button } from '@/components/ui/button';
import DaySection from './DaySection';
import VirtualList from './VirtualList';
import { PlannerWidgetErrorBoundary } from '@/components/ErrorBoundary/PlannerWidgetErrorBoundary';

interface PastAssignmentsProps {
  pastDates: string[];
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
  canEdit: boolean;
  canPublishTasks: boolean;
  cars?: Car[];
  gridLayout?: boolean;
}

const PastAssignments: React.FC<PastAssignmentsProps> = ({
  pastDates,
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
  canEdit,
  canPublishTasks,
  cars = [],
  gridLayout = false
}) => {
  const { t } = useTranslation();
  const INITIAL = 14;
  const STEP = 14;
  const [visible, setVisible] = useState(INITIAL);

  useEffect(() => {
    setVisible(INITIAL);
  }, [pastDates.length]);

  // Show the most recent N past dates (assume newest first; fallback to slice end)
  const visibleDates = useMemo(
    () => pastDates.slice(0, visible),
    [pastDates, visible]
  );

  if (pastDates.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
        {t("planner.previousDays")}
      </h2>
      <VirtualList
        items={visibleDates}
        getKey={(dateKey) => dateKey}
        estimateSize={120}
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
            canEdit={canEdit}
            canPublishTasks={canPublishTasks}
            cars={cars}
            operationStates={operationStates}
            gridLayout={gridLayout}
          />
          </PlannerWidgetErrorBoundary>
        )}
      />
      {visible < pastDates.length && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible(v => v + STEP)}
          >
            Vis flere ({pastDates.length - visible} tilbage)
          </Button>
        </div>
      )}
    </div>
  );
};

export default PastAssignments;
