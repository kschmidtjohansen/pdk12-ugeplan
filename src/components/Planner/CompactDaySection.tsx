import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { formatDateWithCapital } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, ChevronDown, ChevronRight } from 'lucide-react';
import CompactAssignmentRow from './CompactAssignmentRow';

interface CompactDaySectionProps {
  dateKey: string;
  dayAssignments: Assignment[];
  operationStates: Record<string, 'publishing' | 'deleting' | 'updating' | null>;
  isExpanded: boolean;
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

const CompactDaySection: React.FC<CompactDaySectionProps> = ({
  dateKey,
  dayAssignments = [],
  operationStates,
  isExpanded,
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
  const { t, currentLanguage } = useTranslation();
  
  const formattedDate = formatDateWithCapital(dateKey, currentLanguage);
  const hasUnpublishedAssignments = Array.isArray(dayAssignments) && dayAssignments.some(a => !a.published);
  const assignmentsCount = Array.isArray(dayAssignments) ? dayAssignments.length : 0;

  const handlePublishDay = () => {
    if (onPublishDay) {
      onPublishDay(dateKey);
    }
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      {/* Day Header - Compact */}
      <div 
        className="flex items-center justify-between px-4 py-2.5 bg-primary/5 border-b cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => onToggleExpansion(dateKey)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpansion(dateKey);
          }
        }}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className="font-semibold text-sm">{formattedDate}</h3>
          <Badge variant="secondary" className="text-xs">
            {assignmentsCount} {currentLanguage === 'da' ? (assignmentsCount === 1 ? 'opgave' : 'opgaver') : (assignmentsCount === 1 ? 'task' : 'tasks')}
          </Badge>
        </div>
        
        {canPublishTasks && hasUnpublishedAssignments && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={(e) => {
              e.stopPropagation();
              handlePublishDay();
            }}
            className="h-7 text-xs bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
          >
            <Send className="h-3 w-3 mr-1" /> 
            {t('planner.publish')}
          </Button>
        )}
      </div>
      
      {/* Table Content */}
      {isExpanded && (
        <div className="overflow-x-auto">
          {assignmentsCount > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="py-2 px-3 w-[100px]">{t('planner.time')}</th>
                  <th className="py-2 px-3 w-[140px]">{currentLanguage === 'da' ? 'Sag' : 'Case'}</th>
                  <th className="py-2 px-3">{t('planner.location')}</th>
                  <th className="py-2 px-3 w-[100px]">{t('planner.car')}</th>
                  <th className="py-2 px-3 w-[120px]">{t('planner.employees')}</th>
                  <th className="py-2 px-3 w-[80px]">Status</th>
                  <th className="py-2 px-3 w-[100px]"></th>
                </tr>
              </thead>
              <tbody>
                {dayAssignments.map(assignment => (
                  <CompactAssignmentRow 
                    key={assignment.id}
                    assignment={assignment}
                    cars={cars}
                    canEdit={canEdit}
                    onEdit={() => onEditAssignment(assignment)}
                    onDelete={() => onDeleteAssignment(assignment.id)}
                    onPublish={onPublishAssignment ? () => onPublishAssignment(assignment.id) : undefined}
                    onCopy={onCopyAssignment ? () => onCopyAssignment(assignment) : undefined}
                    onViewDetails={() => onViewAssignmentDetails(assignment)}
                    operationState={operationStates[assignment.id] ?? null}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {t('planner.nothingPlannedToday')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactDaySection;