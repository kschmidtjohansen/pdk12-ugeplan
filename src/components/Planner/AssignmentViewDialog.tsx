import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Assignment } from '@/types/assignment';
import { Car } from '@/types/car';
import { OneDriveFolderButton } from '@/components/OneDrive/OneDriveFolderButton';
import { useTranslation } from '@/context/TranslationContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Car as CarIcon, 
  UserCheck, 
  Navigation,
  FileText,
  Edit3
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';

interface AssignmentViewDialogProps {
  assignment: Assignment | null;
  cars: Car[];
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (assignment: Assignment) => void;
  canEdit?: boolean;
}

export const AssignmentViewDialog: React.FC<AssignmentViewDialogProps> = ({
  assignment,
  cars,
  isOpen,
  onClose,
  onEdit,
  canEdit = false
}) => {
  const { t, currentLanguage } = useTranslation();

  if (!assignment) return null;

  const formatDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const locale = currentLanguage === 'da' ? da : undefined;
    return format(date, 'EEEE d. MMMM yyyy', { locale });
  };

  const getCarNames = (assignment: Assignment): string[] => {
    const carNames: string[] = [];
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      assignment.cars.forEach((carId: string) => {
        if (carId) {
          const car = cars.find(c => c.id === carId);
          if (car) {
            carNames.push(car.name);
          } else {
            carNames.push(`Car ${carId.substring(0, 8)}`);
          }
        }
      });
    } else if (assignment.car) {
      if (typeof assignment.car === 'string') {
        const car = cars.find(c => c.id === assignment.car);
        if (car) {
          carNames.push(car.name);
        } else {
          carNames.push(`Car ${assignment.car.substring(0, 8)}`);
        }
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        carNames.push(assignment.car.name);
      }
    }
    return carNames;
  };

  const handleNavigate = (location: string) => {
    const encodedLocation = encodeURIComponent(location);
    const url = `https://www.google.com/maps/dir/Current+Location/${encodedLocation}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const carNames = getCarNames(assignment);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <span>{assignment.title || t('planner.assignment')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={assignment.published ? "default" : "secondary"}>
                {assignment.published ? t('planner.published') : t('planner.notPublished')}
              </Badge>
              {canEdit && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(assignment)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  {t('planner.editAssignment')}
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Case Number and OneDrive */}
          {assignment.case_number && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-medium text-blue-900">Sagsnummer</h3>
                <p className="text-lg font-semibold text-blue-800">{assignment.case_number}</p>
              </div>
              <OneDriveFolderButton 
                caseNumber={assignment.case_number} 
                size="md" 
                showText={true}
                className="bg-white hover:bg-blue-100"
              />
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('planner.dateLabel')}</p>
                <p className="font-medium">{formatDate(assignment.date)}</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('planner.timeLabel')}</p>
                <p className="font-medium">
                  {assignment.fromTime?.substring(0, 5)} - {assignment.toTime?.substring(0, 5)}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          {assignment.location && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t('planner.locationLabel')}</p>
                  <p className="font-medium">{assignment.location}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigate(assignment.location)}
                className="flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                Navigation
              </Button>
            </div>
          )}

          <Separator />

          {/* Team Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team
            </h3>

            {/* Responsible User */}
            {assignment.responsibleUser?.name && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                <UserCheck className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="text-sm text-indigo-600">{t('planner.responsibleUser')}</p>
                  <p className="font-medium text-indigo-900">{assignment.responsibleUser.name}</p>
                </div>
              </div>
            )}

            {/* Assigned Employees */}
            {(assignment.assignedEmployees?.length || assignment.employees?.length) && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('planner.employeesLabel')}</p>
                <div className="flex flex-wrap gap-2">
                  {assignment.assignedEmployees?.length ? (
                    assignment.assignedEmployees.map(emp => (
                      <Badge key={emp.id} variant="secondary">
                        {emp.name}
                      </Badge>
                    ))
                  ) : (
                    assignment.employees?.map((name, index) => (
                      <Badge key={index} variant="secondary">
                        {name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cars */}
          {carNames.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CarIcon className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t('planner.carLabel')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {carNames.map((carName, index) => (
                  <Badge key={index} variant="outline">
                    {carName}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {assignment.description && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('planner.descriptionLabel')}</p>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">{assignment.description}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};