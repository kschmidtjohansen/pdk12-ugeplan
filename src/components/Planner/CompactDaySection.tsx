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

  const dayOfWeek = new Date(`${dateKey}T00:00:00`).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isToday = new Date(`${dateKey}T00:00:00`).toDateString() === new Date().toDateString();

  return (
    <div className={`bg-card rounded-xl border border-border/60 overflow-hidden ${
      isToday ? 'border-primary/40 ring-1 ring-primary/20' : ''
    } ${isWeekend ? 'bg-muted/40' : ''}`}>
      {/* Day Header - Compact */}
      <div 
        className={`flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/60 cursor-pointer transition-colors ${isWeekend ? 'bg-muted/60 hover:bg-muted' : 'bg-muted/40 hover:bg-muted/70'}`}

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
        <div className="flex items-center gap-2 min-w-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <h3 className={`font-semibold text-sm truncate ${isWeekend ? 'text-muted-foreground' : ''}`}>{formattedDate}</h3>
          {isToday && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {currentLanguage === 'da' ? 'I dag' : 'Today'}
            </span>
          )}
          <Badge variant="secondary" className="text-xs tabular-nums shrink-0">
            {assignmentsCount} {currentLanguage === 'da' ? (assignmentsCount === 1 ? 'opgave' : 'opgaver') : (assignmentsCount === 1 ? 'task' : 'tasks')}
          </Badge>
        </div>

        
        {canPublishTasks && hasUnpublishedAssignments && (
          <Button
            size="sm"
            variant="brand"
            onClick={(e) => {
              e.stopPropagation();
              handlePublishDay();
            }}
            className="h-7 text-xs"
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

export default React.memo(CompactDaySection);