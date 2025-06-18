
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { usePermissions } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { Car } from '@/types/car';
import { Assignment } from '@/types/assignment';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { CarSelector } from './CarSelector';
import ResponsibleUserSelector from './ResponsibleUserSelector';
import EmployeeSelector from './EmployeeSelector';

interface AssignmentFormFieldsProps {
  title: string;
  setTitle: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  selectedDate?: Date;
  setSelectedDate: (date: Date | undefined) => void;
  fromTime: string;
  setFromTime: (value: string) => void;
  toTime: string;
  setToTime: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  selectedCarId: string;
  setSelectedCarId: (value: string) => void;
  selectedResponsibleUserId: string;
  setSelectedResponsibleUserId: (value: string) => void;
  selectedEmployees: string[];
  setSelectedEmployees: (employees: string[]) => void;
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  assignmentId?: string;
  assignments?: Assignment[];
}

const AssignmentFormFields: React.FC<AssignmentFormFieldsProps> = ({
  title,
  setTitle,
  location,
  setLocation,
  selectedDate,
  setSelectedDate,
  fromTime,
  setFromTime,
  toTime,
  setToTime,
  description,
  setDescription,
  selectedCarId,
  setSelectedCarId,
  selectedResponsibleUserId,
  setSelectedResponsibleUserId,
  selectedEmployees,
  setSelectedEmployees,
  cars,
  employees,
  vacations,
  assignmentId,
  assignments = []
}) => {
  const { t, currentLanguage } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();

  const currentDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

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

  // Show responsible user field only for admin and skadeleder
  const canAssignResponsibleUser = isAdmin || isSkadeleder;

  // Handle car selection (single car ID)
  const handleCarSelect = (carId: string) => {
    setSelectedCarId(carId);
  };

  // Handle employee toggle
  const handleEmployeeToggle = (employeeName: string) => {
    if (selectedEmployees.includes(employeeName)) {
      setSelectedEmployees(selectedEmployees.filter(name => name !== employeeName));
    } else {
      setSelectedEmployees([...selectedEmployees, employeeName]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title Field */}
      <div className="space-y-2">
        <Label htmlFor="title">{t('planner.enterTitle')}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('planner.enterTitle')}
          required
        />
      </div>

      {/* Location Field */}
      <div className="space-y-2">
        <Label htmlFor="location">{t('planner.location')}</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('planner.enterLocation')}
          required
        />
      </div>

      {/* Date Field */}
      <div className="space-y-2">
        <Label>{t('planner.assignmentDate')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? formatDateDisplay(selectedDate) : t('common.selectDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
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
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toTime">{t('planner.endTime')}</Label>
          <Input
            id="toTime"
            type="time"
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Employee Selector */}
      <EmployeeSelector
        employees={employees}
        selectedEmployees={selectedEmployees}
        onToggle={handleEmployeeToggle}
        vacations={vacations}
        currentDate={currentDateStr}
        assignments={assignments}
      />

      {/* Responsible User Selector - Only for Admin and Skadeleder */}
      {canAssignResponsibleUser && (
        <ResponsibleUserSelector
          selectedUserId={selectedResponsibleUserId}
          onUserSelect={setSelectedResponsibleUserId}
        />
      )}

      {/* Car Selector - Remove duplicate label since CarSelector has its own */}
      <CarSelector
        cars={cars}
        selectedCarId={selectedCarId}
        onCarSelect={handleCarSelect}
        currentDate={currentDateStr}
        assignments={assignments}
        currentAssignmentId={assignmentId}
      />

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('planner.description')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('planner.notesPlaceholder')}
          rows={3}
        />
      </div>
    </div>
  );
};

export default AssignmentFormFields;
