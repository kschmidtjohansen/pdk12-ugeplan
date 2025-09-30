
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

          {/* Car Assignment - Handle both new (cars array) and old (single car) format */}
          {((assignment.cars && assignment.cars.length > 0) || assignment.car) && (
            <div className="flex items-start gap-3">
              <Car className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <span className="font-medium">{t('planner.car')}: </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {assignment.cars && assignment.cars.length > 0 ? (
                    assignment.cars.map((carName, index) => (
                      <Badge key={index} variant="outline">
                        {carName}
                      </Badge>
                    ))
                  ) : assignment.car ? (
                    <Badge variant="outline">
                      {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
                    </Badge>
                  ) : null}
                </div>
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

          {/* Assigned Employees - Handle both new (assignedEmployees with full data) and old (employees string array) format */}
          {((assignment.assignedEmployees && assignment.assignedEmployees.length > 0) || (assignment.employees && assignment.employees.length > 0)) && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
              <div>
                <span className="font-medium">{t('planner.employees')}: </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {assignment.assignedEmployees && assignment.assignedEmployees.length > 0 ? (
                    assignment.assignedEmployees.map((employee) => (
                      <Badge key={employee.id} variant="outline">
                        {employee.name}
                      </Badge>
                    ))
                  ) : assignment.employees && assignment.employees.length > 0 ? (
                    assignment.employees.map((employee, index) => (
                      <Badge key={index} variant="outline">
                        {employee}
                      </Badge>
                    ))
                  ) : null}
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
