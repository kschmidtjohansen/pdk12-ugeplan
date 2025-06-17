
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import DaySection from './DaySection';

interface PastAssignmentsProps {
  pastDates: string[];
  groupedAssignments: Record<string, Assignment[]>;
  expandedDays: Record<string, boolean>;
  onToggleExpansion: (date: string) => void;
  onPublishDay?: (date: string) => void; // FIXED: Updated to accept date parameter
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onCopyAssignment?: (assignment: Assignment) => void;
  canEdit: boolean;
  canPublishTasks: boolean;
  cars?: Car[];
}

const PastAssignments: React.FC<PastAssignmentsProps> = ({
  pastDates,
  groupedAssignments = {}, // Initialize with empty object as fallback
  expandedDays,
  onToggleExpansion,
  onPublishDay,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onCopyAssignment,
  canEdit,
  canPublishTasks,
  cars = []
}) => {
  const { t } = useTranslation();
  
  if (pastDates.length === 0) return null;
  
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">
        {t("planner.previousDays")}
      </h2>
      <div className="space-y-6">
        {pastDates.map(dateKey => (
          <DaySection 
            key={dateKey}
            dateKey={dateKey}
            dayAssignments={groupedAssignments[dateKey] || []} // Provide an empty array if undefined
            isExpanded={expandedDays[dateKey] !== false} // Default to expanded
            onToggleExpansion={onToggleExpansion}
            onPublishDay={onPublishDay}
            onEditAssignment={onEditAssignment}
            onDeleteAssignment={onDeleteAssignment}
            onPublishAssignment={onPublishAssignment}
            onCopyAssignment={onCopyAssignment}
            canEdit={canEdit}
            canPublishTasks={canPublishTasks}
            cars={cars}
          />
        ))}
      </div>
    </div>
  );
};

export default PastAssignments;
