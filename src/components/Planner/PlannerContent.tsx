
import React, { useState, useMemo } from 'react';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth, usePermissions } from '@/context/AuthContext';
import { useCars } from '@/hooks/car';
import CurrentAndFutureDays from './CurrentAndFutureDays';
import PastAssignments from './PastAssignments';
import UnassignedResourcesSection from './UnassignedResourcesSection';
import EmptyState from './EmptyState';
import { format } from 'date-fns';

interface PlannerContentProps {
  weekAssignments: Assignment[];
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onPublishDay: (date: string) => void; // FIXED: Changed to accept date parameter
  onCreateAssignment: (date: string) => void;
  onCopyAssignment?: (assignment: Assignment) => void;
  selectedWeek: number;
  selectedYear: number;
  weekDates: { start: Date; end: Date } | null;
  handleShowOnScreen?: () => void;
}

const PlannerContent: React.FC<PlannerContentProps> = ({
  weekAssignments,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  onPublishDay,
  onCreateAssignment,
  onCopyAssignment,
  selectedWeek,
  selectedYear,
  weekDates,
  handleShowOnScreen
}) => {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();
  const { canEdit, canPublishTasks } = usePermissions();
  const { cars } = useCars();
  
  // State for managing day expansion
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const { groupedAssignments, currentAndFutureDates, pastDates } = useMemo(() => {
    const grouped: Record<string, Assignment[]> = {};
    
    weekAssignments.forEach(assignment => {
      const dateKey = assignment.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(assignment);
    });

    const today = new Date().toISOString().split('T')[0];
    const allDates = Object.keys(grouped).sort();
    
    const currentFuture = allDates.filter(date => date >= today);
    const past = allDates.filter(date => date < today);
    
    return {
      groupedAssignments: grouped,
      currentAndFutureDates: currentFuture,
      pastDates: past
    };
  }, [weekAssignments]);

  const handleToggleExpansion = (date: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // FIXED: Create a wrapper that passes the date to onPublishDay
  const handlePublishDayWithDate = (date: string) => {
    console.log(`[PlannerContent] Publishing day: ${date}`);
    onPublishDay(date);
  };

  if (weekAssignments.length === 0) {
    return (
      <EmptyState 
        message={t('planner.noAssignmentsForWeek')}
        selectedWeek={selectedWeek} 
        selectedYear={selectedYear} 
        onCreateAssignment={onCreateAssignment}
        canEdit={canEdit}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Unassigned Resources Section */}
      <UnassignedResourcesSection 
        assignments={weekAssignments}
        cars={cars}
        onCreateAssignment={onCreateAssignment}
        weekDates={weekDates}
        canEdit={canEdit}
        handleShowOnScreen={handleShowOnScreen}
      />

      {/* Current and Future Days */}
      <CurrentAndFutureDays
        dates={currentAndFutureDates}
        groupedAssignments={groupedAssignments}
        expandedDays={expandedDays}
        onToggleExpansion={handleToggleExpansion}
        onPublishDay={handlePublishDayWithDate} // FIXED: Use the wrapper function
        onEditAssignment={onEditAssignment}
        onDeleteAssignment={onDeleteAssignment}
        onPublishAssignment={onPublishAssignment}
        onCopyAssignment={onCopyAssignment}
        canEdit={canEdit}
        canPublishTasks={canPublishTasks}
        cars={cars}
      />

      {/* Past Assignments */}
      <PastAssignments
        pastDates={pastDates}
        groupedAssignments={groupedAssignments}
        expandedDays={expandedDays}
        onToggleExpansion={handleToggleExpansion}
        onPublishDay={handlePublishDayWithDate} // FIXED: Use the wrapper function
        onEditAssignment={onEditAssignment}
        onDeleteAssignment={onDeleteAssignment}
        onPublishAssignment={onPublishAssignment}
        onCopyAssignment={onCopyAssignment}
        canEdit={canEdit}
        canPublishTasks={canPublishTasks}
        cars={cars}
      />
    </div>
  );
};

export default PlannerContent;
