
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Assignment } from '@/types/assignment';
import { Car as CarType } from '@/types/car';
import { Calendar, Clock, MapPin, Car, Users, UserCheck, Pencil } from 'lucide-react';

interface AssignmentDetailsDialogProps {
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
  cars: CarType[];
  onEdit?: (assignment: Assignment) => void;
}

const AssignmentDetailsDialog: React.FC<AssignmentDetailsDialogProps> = ({
  assignment,
  isOpen,
  onClose,
  cars,
  onEdit
}) => {
  const { t, currentLanguage } = useTranslation();

  if (!assignment) return null;

  // Helper to get car names from IDs
  const getCarNames = (): string[] => {
    const carNames: string[] = [];
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      assignment.cars.forEach((carId: string) => {
        if (carId) {
          const car = cars.find(c => c.id === carId);
          if (car) {
            carNames.push(car.name);
          }
        }
      });
    } else if (assignment.car) {
      if (typeof assignment.car === 'string') {
        const car = cars.find(c => c.id === assignment.car);
        if (car) {
          carNames.push(car.name);
        }
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        carNames.push(assignment.car.name);
      }
    }
    return carNames;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      currentLanguage === 'da' ? 'da-DK' : 'en-GB',
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  const carNames = getCarNames();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            {assignment.location}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5">
          {/* Title and Status */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">{assignment.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={assignment.published ? "default" : "secondary"}>
                  {assignment.published ? t('planner.published') : t('planner.notPublished')}
                </Badge>
                {onEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      onEdit(assignment);
                      onClose();
                    }}
                    className="flex items-center gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t('common.edit')}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Description - Full width */}
            {assignment.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{t('planner.description')}</h4>
                <p className="text-sm leading-relaxed">{assignment.description}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Date and Time Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('planner.dateAndTime') || 'Dato og tid'}
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <div className="text-sm">
                  <span className="font-medium">{t('planner.date')}: </span>
                  <span>{formatDate(assignment.date)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                <div className="text-sm">
                  <span className="font-medium">{t('planner.time')}: </span>
                  <span>{assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Assignment Details Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('planner.assignmentDetails') || 'Opgave detaljer'}
            </h4>
            <div className="grid gap-3">
              {/* Cars */}
              {carNames.length > 0 && (
                <div className="flex items-center gap-3">
                  <Car className="h-4 w-4 text-primary" />
                  <div className="flex items-center flex-wrap gap-2 text-sm">
                    <span className="font-medium">{t('planner.car')}:</span>
                    {carNames.map((carName, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {carName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Responsible User */}
              {assignment.responsibleUser && (
                <div className="flex items-center gap-3">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <div className="text-sm">
                    <span className="font-medium">{t('planner.responsibleUser')}: </span>
                    <span>{assignment.responsibleUser.name}</span>
                  </div>
                </div>
              )}

              {/* Assigned Employees */}
              {((assignment.assignedEmployees && assignment.assignedEmployees.length > 0) || (assignment.employees && assignment.employees.length > 0)) && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-primary" />
                  <div className="flex items-center flex-wrap gap-2 text-sm">
                    <span className="font-medium">{t('planner.employees')}:</span>
                    {assignment.assignedEmployees && assignment.assignedEmployees.length > 0 ? (
                      assignment.assignedEmployees.map((employee) => (
                        <Badge key={employee.id} variant="outline" className="text-xs">
                          {employee.name}
                        </Badge>
                      ))
                    ) : assignment.employees && assignment.employees.length > 0 ? (
                      assignment.employees.map((employee, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {employee}
                        </Badge>
                      ))
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDetailsDialog;
