
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

  console.log('[AssignmentFormFields] Rendering with car state:', {
    selectedCarId,
    carType: typeof selectedCarId,
    isEmpty: selectedCarId === '' || !selectedCarId
  });

  const currentDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  // Format date with Danish locale and proper timezone handling
  const formatDateDisplay = (date: Date) => {
    try {
      console.log('[AssignmentFormFields] Formatting date:', date);
      const locale = currentLanguage === 'da' ? da : undefined;
      const formatted = format(date, "PPP", { locale });
      console.log('[AssignmentFormFields] Formatted date:', formatted);
      return formatted;
    } catch (e) {
      console.error("Error formatting date:", e);
      return format(date, "PPP");
    }
  };

  // Handle date selection with proper timezone handling
  const handleDateSelect = (date: Date | undefined) => {
    console.log('[AssignmentFormFields] Date selected:', date);
    if (date) {
      // Ensure we're working with the correct date by creating a new date in local timezone
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      console.log('[AssignmentFormFields] Local date created:', localDate);
      setSelectedDate(localDate);
    } else {
      setSelectedDate(undefined);
    }
  };

  // Show responsible user field only for admin and skadeleder
  const canAssignResponsibleUser = isAdmin || isSkadeleder;

  // Handle car selection with comprehensive debugging
  const handleCarSelect = (carId: string) => {
    console.log('[AssignmentFormFields] Car selection handler called:', {
      carId,
      carType: typeof carId,
      isEmpty: carId === '' || !carId,
      previousSelection: selectedCarId
    });
    
    // Ensure we always pass a string (empty string for no car)
    const normalizedCarId = carId || '';
    console.log('[AssignmentFormFields] Setting normalized car ID:', normalizedCarId);
    setSelectedCarId(normalizedCarId);
  };

  // Handle employee toggle with debugging
  const handleEmployeeToggle = (employeeName: string) => {
    console.log('[AssignmentFormFields] Employee toggled:', employeeName);
    console.log('[AssignmentFormFields] Current employees:', selectedEmployees);
    
    let newEmployees;
    if (selectedEmployees.includes(employeeName)) {
      newEmployees = selectedEmployees.filter(name => name !== employeeName);
    } else {
      newEmployees = [...selectedEmployees, employeeName];
    }
    
    console.log('[AssignmentFormFields] New employees:', newEmployees);
    setSelectedEmployees(newEmployees);
  };

  return (
    <div className="space-y-4">
      {/* Title Field */}
      <div className="space-y-2">
        <Label htmlFor="title">{t('planner.enterTitle')}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => {
            console.log('[AssignmentFormFields] Title changed:', e.target.value);
            setTitle(e.target.value);
          }}
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
          onChange={(e) => {
            console.log('[AssignmentFormFields] Location changed:', e.target.value);
            setLocation(e.target.value);
          }}
          placeholder={t('planner.enterLocation')}
          required
        />
      </div>

      {/* Date Field with Enhanced Calendar */}
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
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              locale={currentLanguage === 'da' ? da : undefined}
              className="pointer-events-auto"
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
            onChange={(e) => {
              console.log('[AssignmentFormFields] From time changed:', e.target.value);
              setFromTime(e.target.value);
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toTime">{t('planner.endTime')}</Label>
          <Input
            id="toTime"
            type="time"
            value={toTime}
            onChange={(e) => {
              console.log('[AssignmentFormFields] To time changed:', e.target.value);
              setToTime(e.target.value);
            }}
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
          onUserSelect={(userId) => {
            console.log('[AssignmentFormFields] Responsible user selected:', userId);
            setSelectedResponsibleUserId(userId);
          }}
        />
      )}

      {/* Car Selector with enhanced debugging */}
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
          onChange={(e) => {
            console.log('[AssignmentFormFields] Description changed:', e.target.value);
            setDescription(e.target.value);
          }}
          placeholder={t('planner.notesPlaceholder')}
          rows={3}
        />
      </div>
    </div>
  );
};

export default AssignmentFormFields;
