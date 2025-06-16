
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Calendar, Plus } from 'lucide-react';
import AssignmentCard from './AssignmentCard';
import { format, parseISO } from 'date-fns';

interface DaySectionProps {
  dateKey: string;
  dayAssignments: Assignment[];
  isExpanded: boolean;
  onToggleExpansion: (date: string) => void;
  onPublishDay?: () => void;
  onEditAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment?: (assignmentId: string) => void;
  onCopyAssignment?: (assignment: Assignment) => void;
  canEdit: boolean;
  canPublishTasks: boolean;
  cars?: Car[];
}

const DaySection: React.FC<DaySectionProps> = ({
  dateKey,
  dayAssignments,
  isExpanded,
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
  const { t, currentLanguage } = useTranslation();

  // Format the date for display
  const formattedDate = format(parseISO(dateKey), 'EEEE, d. MMMM yyyy', {
    locale: currentLanguage === 'da' ? require('date-fns/locale/da') : require('date-fns/locale/en-US')
  });

  const hasUnpublishedAssignments = dayAssignments.some(assignment => !assignment.published);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">
              {formattedDate}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              ({dayAssignments.length} {t('planner.assignments').toLowerCase()})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {canPublishTasks && hasUnpublishedAssignments && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPublishDay}
                className="text-xs"
              >
                {t('planner.publishDayTasks')}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpansion(dateKey)}
              className="p-1 h-8 w-8"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          {dayAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('planner.noAssignmentsToday')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onEdit={onEditAssignment}
                  onDelete={() => onDeleteAssignment(assignment.id)}
                  onPublish={onPublishAssignment ? () => onPublishAssignment(assignment.id) : undefined}
                  onCopy={onCopyAssignment ? () => onCopyAssignment(assignment) : undefined}
                  canEdit={canEdit}
                  canPublish={canPublishTasks}
                  cars={cars}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default DaySection;
