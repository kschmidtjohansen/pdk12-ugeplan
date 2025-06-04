
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Assignment } from '@/types/assignment';
import { Calendar, Clock, MapPin, Car, Users, UserCheck } from 'lucide-react';

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      currentLanguage === 'da' ? 'da-DK' : 'en-GB',
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  // Helper function to get car display text
  const getCarDisplayText = () => {
    if (!assignment.car) return null;
    
    if (Array.isArray(assignment.car)) {
      if (assignment.car.length === 0) return null;
      if (assignment.car.length === 1) {
        const car = assignment.car[0];
        return typeof car === 'string' ? car : car.name;
      }
      return assignment.car.map(car => typeof car === 'string' ? car : car.name).join(', ');
    }
    
    return typeof assignment.car === 'string' ? assignment.car : assignment.car.name;
  };

  const carDisplayText = getCarDisplayText();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {assignment.location}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex justify-between items-start">
            <Badge variant={assignment.published ? "default" : "secondary"}>
              {assignment.published ? t('planner.published') : t('planner.notPublished')}
            </Badge>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">{t('planner.title')}</h4>
              <p className="text-gray-600">{assignment.title}</p>
            </div>
            
            {assignment.description && (
              <div className="space-y-2">
                <h4 className="font-semibold">{t('planner.description')}</h4>
                <p className="text-gray-600">{assignment.description}</p>
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <span className="font-medium">{t('planner.assignmentDate')}: </span>
                <span>{formatDate(assignment.date)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <span className="font-medium">{t('planner.assignmentTime')}: </span>
                <span>{assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}</span>
              </div>
            </div>
          </div>

          {/* Car Assignment */}
          {carDisplayText && (
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-orange-600" />
              <div>
                <span className="font-medium">{t('planner.car')}: </span>
                <span>{carDisplayText}</span>
              </div>
            </div>
          )}

          {/* Responsible User */}
          {assignment.responsibleUser && (
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 text-purple-600" />
              <div>
                <span className="font-medium">{t('planner.responsibleUser')}: </span>
                <span>{assignment.responsibleUser.name}</span>
              </div>
            </div>
          )}

          {/* Assigned Employees */}
          {assignment.employees && assignment.employees.length > 0 && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <span className="font-medium">{t('planner.employees')}: </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {assignment.employees.map((employee, index) => (
                    <Badge key={index} variant="outline">
                      {employee}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDetailsDialog;
