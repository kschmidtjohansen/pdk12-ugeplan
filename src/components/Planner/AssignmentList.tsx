
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
  onCreateAssignment: () => void;
}

const AssignmentList: React.FC<AssignmentListProps> = ({
  assignments,
  onEditAssignment,
  onDeleteAssignment,
  onCreateAssignment,
}) => {
  const { canEdit, canCreate } = usePermissions();
  const { t } = useTranslation();
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // Group assignments by date
  const groupedAssignments = assignments.reduce<Record<string, Assignment[]>>(
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

  if (assignments.length === 0) {
    return <EmptyState onCreateNew={onCreateAssignment} canCreate={canCreate} />;
  }

  return (
    <div className="space-y-6 w-full">
      {sortedDates.map((dateKey) => {
        const isExpanded = expandedDays[dateKey] !== false; // Default to expanded
        const dayAssignments = groupedAssignments[dateKey];
        
        return (
          <div key={dateKey} className="space-y-3 w-full">
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
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                {dayAssignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    canEdit={canEdit}
                    onEdit={() => onEditAssignment(assignment)}
                    onDelete={() => onDeleteAssignment(assignment.id)}
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
