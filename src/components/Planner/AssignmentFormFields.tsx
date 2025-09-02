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
  caseNumber: string;
  setCaseNumber: (value: string) => void;
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
  selectedEmployees: string[]; // Now stores employee IDs instead of names
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
  caseNumber,
  setCaseNumber,
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
  const {
    t,
    currentLanguage
  } = useTranslation();
  const {
    isAdmin,
    isSkadeleder
  } = usePermissions();
  console.log('[AssignmentFormFields] Rendering with car state:', {
    selectedCarId,
    carType: typeof selectedCarId,
    isEmpty: selectedCarId === '' || !selectedCarId
  });
  const currentDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  // FIXED: Enhanced date formatting with proper timezone handling
  const formatDateDisplay = (date: Date) => {
    try {
      console.log('[AssignmentFormFields] Formatting date:', date);
      const locale = currentLanguage === 'da' ? da : undefined;

      // Create a new date in local timezone to prevent shifts
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const formatted = format(localDate, "PPP", {
        locale
      });
      console.log('[AssignmentFormFields] Formatted date:', formatted);
      return formatted;
    } catch (e) {
      console.error("Error formatting date:", e);
      return format(date, "PPP");
    }
  };

  // FIXED: Use local date methods instead of UTC to prevent timezone shifts
  const handleDateSelect = (date: Date | undefined) => {
    console.log('[AssignmentFormFields] Date selected from calendar:', date);
    if (date) {
      // Use local date methods instead of UTC to prevent timezone shifts
      const localYear = date.getFullYear();
      const localMonth = date.getMonth();
      const localDay = date.getDate();

      // Create a local date using the local components
      const localDate = new Date(localYear, localMonth, localDay);
      console.log('[AssignmentFormFields] Created timezone-safe date:', localDate);
      console.log('[AssignmentFormFields] Date ISO string:', localDate.toISOString().split('T')[0]);
      setSelectedDate(localDate);
    } else {
      setSelectedDate(undefined);
    }
  };

  // Show responsible user field only for admin and skadeleder
  const canAssignResponsibleUser = isAdmin || isSkadeleder;

  // FIXED: Enhanced car selection with better validation
  const handleCarSelect = (carId: string) => {
    console.log('[AssignmentFormFields] Car selection handler called:', {
      carId,
      carType: typeof carId,
      isEmpty: carId === '' || !carId,
      previousSelection: selectedCarId
    });

    // Ensure we always pass a valid string
    const normalizedCarId = carId && carId.trim() !== '' ? carId : '';
    console.log('[AssignmentFormFields] Setting normalized car ID:', normalizedCarId);
    setSelectedCarId(normalizedCarId);
  };

  // FIXED: Enhanced employee selection with validation - now uses employee IDs
  const handleEmployeeToggle = (employeeId: string) => {
    console.log('[AssignmentFormFields] Employee toggled:', employeeId);
    console.log('[AssignmentFormFields] Current employees:', selectedEmployees);
    if (!employeeId || employeeId.trim() === '') {
      console.warn('[AssignmentFormFields] Invalid employee ID provided');
      return;
    }
    let newEmployees;
    if (selectedEmployees.includes(employeeId)) {
      newEmployees = selectedEmployees.filter(id => id !== employeeId);
    } else {
      newEmployees = [...selectedEmployees, employeeId];
    }
    console.log('[AssignmentFormFields] New employees:', newEmployees);
    setSelectedEmployees(newEmployees);
  };
  return <div className="space-y-4">
      {/* Title Field - Updated to use enterTitle translation */}
      <div className="space-y-2">
        <Label htmlFor="title">{t('planner.enterTitle')}</Label>
        <Input id="title" value={title} onChange={e => {
        console.log('[AssignmentFormFields] Title changed:', e.target.value);
        setTitle(e.target.value);
      }} placeholder={t('planner.enterTitle')} required />
      </div>

      {/* Location Field - Updated to use enterLocation translation */}
      

      {/* Date Field - Updated to use assignmentDate translation */}
      <div className="space-y-2">
        <Label>{t('planner.assignmentDate')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? formatDateDisplay(selectedDate) : t('common.selectDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus locale={currentLanguage === 'da' ? da : undefined} className="pointer-events-auto" disabled={date => {
            // Prevent selection of dates in the past (except today)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today;
          }} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Fields - Updated to use startTime and endTime translations */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromTime">{t('planner.startTime')}</Label>
          <Input id="fromTime" type="time" value={fromTime} onChange={e => {
          console.log('[AssignmentFormFields] From time changed:', e.target.value);
          setFromTime(e.target.value);
        }} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toTime">{t('planner.endTime')}</Label>
          <Input id="toTime" type="time" value={toTime} onChange={e => {
          console.log('[AssignmentFormFields] To time changed:', e.target.value);
          setToTime(e.target.value);
        }} required />
        </div>
      </div>

      {/* Employee Selector */}
      <EmployeeSelector employees={employees} selectedEmployees={selectedEmployees} onToggle={handleEmployeeToggle} vacations={vacations} currentDate={currentDateStr} assignments={assignments} />

      {/* Responsible User Selector - Updated to use responsibleUser translation */}
      {canAssignResponsibleUser && <ResponsibleUserSelector selectedUserId={selectedResponsibleUserId} onUserSelect={userId => {
      console.log('[AssignmentFormFields] Responsible user selected:', userId);
      setSelectedResponsibleUserId(userId);
    }} />}

      {/* Car Selector with enhanced error handling */}
      <CarSelector cars={cars} selectedCarId={selectedCarId} onCarSelect={handleCarSelect} currentDate={currentDateStr} assignments={assignments} currentAssignmentId={assignmentId} />

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('planner.assignmentDescription')}</Label>
        <Textarea id="description" value={description} onChange={e => {
        console.log('[AssignmentFormFields] Description changed:', e.target.value);
        setDescription(e.target.value);
      }} placeholder={t('planner.notesPlaceholder')} rows={3} />
      </div>
    </div>;
};
export default AssignmentFormFields;