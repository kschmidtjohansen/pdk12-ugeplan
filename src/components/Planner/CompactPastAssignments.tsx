import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Button } from '@/components/ui/button';
import CompactDaySection from './CompactDaySection';
import VirtualList from './VirtualList';

interface CompactPastAssignmentsProps {
  pastDates: string[];
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

const CompactPastAssignments: React.FC<CompactPastAssignmentsProps> = ({
  pastDates,
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
  const { t } = useTranslation();
  const INITIAL = 14;
  const STEP = 14;
  const [visible, setVisible] = useState(INITIAL);

  useEffect(() => {
    setVisible(INITIAL);
  }, [pastDates.length]);

  const visibleDates = useMemo(
    () => pastDates.slice(0, visible),
    [pastDates, visible]
  );

  if (pastDates.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3 text-muted-foreground border-b pb-2">
        {t("planner.previousDays")}
      </h2>
      <VirtualList
        items={visibleDates}
        getKey={(dateKey) => dateKey}
        estimateSize={56}
        gap={12}
        threshold={10}
        renderItem={(dateKey) => (
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
        )}
      />
      {visible < pastDates.length && (
        <div className="mt-3 flex justify-center">
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

export default CompactPastAssignments;