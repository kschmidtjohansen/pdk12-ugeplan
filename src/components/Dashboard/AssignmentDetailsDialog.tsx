
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Users, Car, User } from 'lucide-react';

interface AssignmentDetailsDialogProps {
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
}

const AssignmentDetailsDialog: React.FC<AssignmentDetailsDialogProps> = ({
  assignment,
  isOpen,
  onClose
}) => {
  const { t, currentLanguage } = useTranslation();

  if (!assignment) return null;

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      const locale = currentLanguage === 'da' ? da : undefined;
      return format(date, 'EEEE, d. MMMM yyyy', { locale });
    } catch (error) {
      return dateStr;
    }
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds if present
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {assignment.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex justify-end">
            <Badge variant={assignment.published ? "default" : "secondary"}>
              {assignment.published ? t('planner.published') : t('planner.unpublished')}
            </Badge>
          </div>

          {/* Date and Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(assignment.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatTime(assignment.fromTime)} - {formatTime(assignment.toTime)}</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{assignment.location}</span>
          </div>

          {/* Employees */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{t('planner.employees')}</span>
            </div>
            <div className="pl-6">
              {assignment.employees && assignment.employees.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {assignment.employees.map((employee, index) => (
                    <li key={index}>• {employee}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">{t('planner.noEmployeesAssigned')}</span>
              )}
            </div>
          </div>

          {/* Car */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span>{t('planner.car')}</span>
            </div>
            <div className="pl-6">
              <span className="text-sm">
                {assignment.car 
                  ? (typeof assignment.car === 'string' ? assignment.car : assignment.car.name)
                  : t('planner.noCarAssigned')
                }
              </span>
            </div>
          </div>

          {/* Responsible User */}
          {assignment.responsibleUser && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{t('planner.responsibleUser')}</span>
              </div>
              <div className="pl-6">
                <span className="text-sm">{assignment.responsibleUser.name}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {assignment.description && (
            <div className="space-y-2">
              <div className="text-sm font-medium">{t('planner.description')}</div>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {assignment.description}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDetailsDialog;
