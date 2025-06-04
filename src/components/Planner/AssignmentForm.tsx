
import React from 'react';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { EmployeeSelector } from './EmployeeSelector';
import { CarSelector } from './CarSelector';
import ResponsibleUserSelector from './ResponsibleUserSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { Car } from '../../types/car';
import { Employee } from '../../types/employee';
import { Vacation } from '../../types/vacation';
import { Assignment } from '../../types/assignment';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssignmentFormProps {
  currentAssignment: Assignment | null;
  formData: Partial<Assignment>;
  selectedEmployees: string[];
  setSelectedEmployees: React.Dispatch<React.SetStateAction<string[]>>;
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  assignments: Assignment[];
  selectedDate: string;
  onSubmit: (data: Partial<Assignment>) => void;
  onDelete: (id: string) => void;
  onPublish?: (id: string) => void;
  onPublishDay?: () => void;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  currentAssignment,
  formData,
  selectedEmployees,
  setSelectedEmployees,
  cars,
  employees,
  vacations,
  assignments,
  selectedDate,
  onSubmit,
  onDelete,
  onPublish,
  onPublishDay
}) => {
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // This would need to be passed from parent or handled differently
    console.log('Input change:', name, value);
  };

  // Handle employee toggle
  const handleEmployeeToggle = (employeeName: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeName) 
        ? prev.filter(name => name !== employeeName)
        : [...prev, employeeName]
    );
  };

  // Handle car selection
  const handleCarSelect = (carIds: string[]) => {
    console.log('Car selection:', carIds);
    // This would need to be passed from parent or handled differently
  };

  // Handle responsible user selection
  const handleResponsibleUserSelect = (userId: string) => {
    console.log('Responsible user selection:', userId);
    // This would need to be passed from parent or handled differently
  };

  // Format date with Danish locale
  const formatDateDisplay = (date: Date) => {
    try {
      const locale = currentLanguage === 'da' ? da : undefined;
      return format(date, "PPP", { locale });
    } catch (e) {
      console.error("Error formatting date:", e);
      return format(date, "PPP");
    }
  };

  // Get selected date
  const selectedDateObj = (() => {
    try {
      if (formData.date) {
        const date = new Date(formData.date + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return new Date(selectedDate + 'T00:00:00');
    } catch (e) {
      console.error("Error parsing date:", e);
      return new Date();
    }
  })();

  // Check if user can assign responsible users
  const canAssignResponsibleUser = user?.role === 'administrator' || user?.role === 'skadeleder';

  // Get selected car IDs
  const selectedCarIds = (() => {
    if (!formData.car) return [];
    if (Array.isArray(formData.car)) return formData.car;
    if (typeof formData.car === 'string') return formData.car ? [formData.car] : [];
    return [];
  })();

  return (
    <DialogContent className="max-w-md">
      <ScrollArea className="max-h-[80vh] pr-4">
        <div className="p-1">
          <DialogHeader>
            <DialogTitle>
              {currentAssignment ? t("planner.editAssignment") : t("planner.newAssignment")}
            </DialogTitle>
            <DialogDescription>
              {currentAssignment ? t("planner.updateDetails") : t("planner.addAssignment")}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('planner.enterTitle')}</Label>
              <Input 
                id="title" 
                value={formData.title || ''} 
                onChange={handleInputChange} 
                placeholder={t('planner.enterTitle')} 
                required 
              />
            </div>

            {/* Location Field */}
            <div className="space-y-2">
              <Label htmlFor="location">{t('planner.location')}</Label>
              <Input 
                id="location" 
                value={formData.location || ''} 
                onChange={handleInputChange} 
                placeholder={t('planner.enterLocation')} 
                required 
              />
            </div>

            {/* Date Field */}
            <div className="space-y-2">
              <Label>{t('planner.assignmentDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDateObj ? formatDateDisplay(selectedDateObj) : t('common.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={selectedDateObj} 
                    onSelect={(date) => console.log('Date selected:', date)} 
                    initialFocus 
                    locale={currentLanguage === 'da' ? da : undefined} 
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromTime">{t('planner.startTime')}</Label>
                <Input 
                  id="fromTime" 
                  type="time" 
                  value={formData.fromTime || ''} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toTime">{t('planner.endTime')}</Label>
                <Input 
                  id="toTime" 
                  type="time" 
                  value={formData.toTime || ''} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
            </div>

            {/* Responsible User Selector */}
            {canAssignResponsibleUser && (
              <ResponsibleUserSelector
                selectedUserId={''}
                onUserSelect={handleResponsibleUserSelect}
              />
            )}

            {/* Employee selector */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('planner.employees')}</h3>
              <EmployeeSelector 
                employees={employees} 
                selectedEmployees={selectedEmployees} 
                onToggle={handleEmployeeToggle} 
                vacations={vacations} 
                currentDate={formData.date || selectedDate} 
                assignments={assignments} 
              />
            </div>

            {/* Car selector */}
            <div className="space-y-2">
              <Label>{t('planner.selectCar')}</Label>
              <CarSelector 
                cars={cars} 
                selectedCarIds={selectedCarIds}
                onCarSelect={handleCarSelect} 
                currentDate={formData.date ? format(new Date(formData.date), 'yyyy-MM-dd') : selectedDate} 
                assignments={assignments} 
                currentAssignmentId={currentAssignment?.id} 
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('planner.description')}</Label>
              <Textarea 
                id="description" 
                value={formData.description || ''} 
                onChange={handleInputChange} 
                placeholder={t('planner.notesPlaceholder')} 
                rows={3} 
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => console.log('Cancel')}>
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                className="bg-polygon-purple hover:bg-polygon-darkpurple" 
                disabled={!selectedEmployees || selectedEmployees.length === 0}
              >
                {currentAssignment ? t("planner.saveChanges") : t("planner.createAssignment")}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </ScrollArea>
    </DialogContent>
  );
};

export default AssignmentForm;
