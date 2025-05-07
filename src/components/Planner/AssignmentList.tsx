
import React, { useState } from 'react';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { format as formatDate } from 'date-fns';
import { Assignment } from '@/types/assignment';
import AssignmentCard from './AssignmentCard';
import EmptyState from './EmptyState';

interface AssignmentListProps {
  assignments: Assignment[];
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onCreateAssignment: () => void;
  selectedWeek?: number;
}

const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onCreateAssignment,
  selectedWeek
}) => {
  const { canEdit, canCreate, canSeeUnpublishedTasks } = usePermissions();
  const { t } = useTranslation();
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // Filter assignments based on user permissions
  const visibleAssignments = canSeeUnpublishedTasks 
    ? assignments 
    : assignments.filter(assignment => assignment.published === true);

  // Group assignments by date
  const groupedAssignments = visibleAssignments.reduce<Record<string, Assignment[]>>(
    (acc, assignment) => {
      const dateKey = formatDate(new Date(assignment.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(assignment);
      return acc;
    },
    {}
  );

  // Sort dates
  const sortedDates = Object.keys(groupedAssignments).sort();

  // Toggle day expansion
  const toggleDayExpansion = (date: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // Format date with capitalized first letter
  const formatDateWithCapital = (date: string) => {
    const dateObj = new Date(date);
    // Get localized date string
    const formattedDate = dateObj.toLocaleDateString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    
    // Capitalize first letter
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  };

  // Check if there are any visible assignments after filtering
  if (visibleAssignments.length === 0) {
    return <EmptyState onCreateNew={onCreateAssignment} canCreate={canCreate} selectedWeek={selectedWeek} />;
  }

  return (
    <div className="w-full space-y-6">
      {sortedDates.map((dateKey) => {
        const isExpanded = expandedDays[dateKey] !== false; // Default to expanded
        const dayAssignments = groupedAssignments[dateKey];
        
        return (
          <div key={dateKey} className="w-full space-y-3">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => toggleDayExpansion(dateKey)}
            >
              <h3 className="text-lg font-medium">
                {formatDateWithCapital(dateKey)}
              </h3>
              <div className="ml-2 text-sm text-gray-500">
                ({dayAssignments.length} {dayAssignments.length === 1 ? 'opgave' : 'opgaver'})
              </div>
            </div>
            
            {isExpanded && (
              <div className="w-full grid grid-cols-1 gap-4">
                {dayAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    canEdit={canEdit}
                    onEdit={() => onEditAssignment(assignment)}
                    onDelete={() => onDeleteAssignment(assignment.id)}
                    onPublish={onPublishAssignment ? () => onPublishAssignment(assignment.id) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AssignmentList;
