
import React from 'react';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/TranslationContext';
import { EmployeeSelector } from './EmployeeSelector';
import { CarSelector } from './CarSelector';
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
  currentAssignment: any | null;
  formData: any;
  selectedEmployees: string[];
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleEmployeeToggle: (employeeName: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  currentDate: string;
  assignments?: Assignment[];
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  currentAssignment,
  formData,
  selectedEmployees,
  cars,
  employees,
  vacations,
  handleInputChange,
  handleSelectChange,
  handleEmployeeToggle,
  handleSubmit,
  onClose,
  currentDate,
  assignments = []
}) => {
  const {
    t,
    currentLanguage
  } = useTranslation();

  // Create a function to handle field changes
  const handleFieldChange = (field: string, value: any) => {
    if (field === 'title' || field === 'location') {
      const event = {
        target: {
          name: field,
          value: value
        }
      } as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(event);
    } else if (field === 'description') {
      const event = {
        target: {
          name: field,
          value: value
        }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(event);
    } else if (field === 'car' && value === 'none') {
      // Convert "none" value to empty string for backward compatibility
      handleSelectChange(field, '');
    } else {
      handleSelectChange(field, value);
    }
  };

  // Format date with Danish locale
  const formatDateDisplay = (date: Date) => {
    try {
      const locale = currentLanguage === 'da' ? da : undefined;
      return format(date, "PPP", {
        locale
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return format(date, "PPP");
    }
  };

  // FIXED: Better date parsing and fallback to current date
  const selectedDate = (() => {
    try {
      if (formData.date) {
        const date = new Date(formData.date + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      // Fallback to current date if formData.date is invalid
      return new Date(currentDate + 'T00:00:00');
    } catch (e) {
      console.error("Error parsing date:", e);
      return new Date(); // Ultimate fallback
    }
  })();

  console.log("AssignmentForm - Current formData:", formData);
  console.log("AssignmentForm - Selected employees:", selectedEmployees);
  console.log("AssignmentForm - Current date:", currentDate);
  console.log("AssignmentForm - Selected date:", selectedDate);
  console.log("AssignmentForm - Form data date:", formData.date);

  return <DialogContent className="max-w-md">
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
            {/* Basic fields first */}
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('planner.enterTitle')}</Label>
              <Input 
                id="title" 
                value={formData.title || ''} 
                onChange={e => handleFieldChange('title', e.target.value)} 
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
                onChange={e => handleFieldChange('location', e.target.value)} 
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
                    {selectedDate ? formatDateDisplay(selectedDate) : t('common.selectDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={selectedDate} 
                    onSelect={date => handleFieldChange('date', date ? format(date, 'yyyy-MM-dd') : '')} 
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
                  onChange={e => handleFieldChange('fromTime', e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toTime">{t('planner.endTime')}</Label>
                <Input 
                  id="toTime" 
                  type="time" 
                  value={formData.toTime || ''} 
                  onChange={e => handleFieldChange('toTime', e.target.value)} 
                  required 
                />
              </div>
            </div>

            {/* Employee selector */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('planner.employees')}</h3>
              <EmployeeSelector 
                employees={employees} 
                selectedEmployees={selectedEmployees} 
                onToggle={handleEmployeeToggle} 
                vacations={vacations} 
                currentDate={formData.date || currentDate} 
                assignments={assignments} 
              />
            </div>

            {/* Car selector */}
            <div className="space-y-2">
              <Label>{t('planner.selectCar')}</Label>
              <CarSelector 
                cars={cars} 
                selectedCarId={formData.car === '' ? 'none' : formData.car || 'none'} 
                onCarSelect={value => handleFieldChange('car', value)} 
                currentDate={formData.date ? format(new Date(formData.date), 'yyyy-MM-dd') : currentDate} 
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
                onChange={e => handleFieldChange('description', e.target.value)} 
                placeholder={t('planner.notesPlaceholder')} 
                rows={3} 
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
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
    </DialogContent>;
};

export default AssignmentForm;
