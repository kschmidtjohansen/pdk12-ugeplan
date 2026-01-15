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
import MultipleCarSelector from './MultipleCarSelector';
import ResponsibleUserSelector from './ResponsibleUserSelector';
import EmployeeSelector from './EmployeeSelector';
import AddressAutocomplete, { RouteInfo } from './AddressAutocomplete';

interface AssignmentFormFieldsProps {
  title: string;
  setTitle: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  selectedDates: Date[];
  setSelectedDates: (dates: Date[]) => void;
  fromTime: string;
  setFromTime: (value: string) => void;
  toTime: string;
  setToTime: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  selectedCarIds: string[];
  setSelectedCarIds: (value: string[]) => void;
  selectedResponsibleUserId: string;
  setSelectedResponsibleUserId: (value: string) => void;
  selectedEmployees: string[]; // Now stores employee IDs instead of names
  onEmployeeToggle: (employeeId: string) => void;
  onRouteInfoChange?: (info: RouteInfo | null) => void;
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  assignmentId?: string;
  assignments?: Assignment[];
  isEditMode?: boolean;
}

const AssignmentFormFields: React.FC<AssignmentFormFieldsProps> = ({
  title,
  setTitle,
  location,
  setLocation,
  selectedDates,
  setSelectedDates,
  fromTime,
  setFromTime,
  toTime,
  setToTime,
  description,
  setDescription,
  selectedCarIds,
  setSelectedCarIds,
  selectedResponsibleUserId,
  setSelectedResponsibleUserId,
  selectedEmployees,
  onEmployeeToggle,
  onRouteInfoChange,
  cars,
  employees,
  vacations,
  assignmentId,
  assignments = [],
  isEditMode = false
}) => {
  const { t, currentLanguage } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();

  console.log('[AssignmentFormFields] Rendering with car state:', {
    selectedCarIds,
    carType: typeof selectedCarIds,
    isEmpty: !selectedCarIds || selectedCarIds.length === 0
  });

  const currentDateStr = selectedDates.length > 0 ? format(selectedDates[0], 'yyyy-MM-dd') : '';

  // FIXED: Enhanced date formatting with proper timezone handling
  const formatDateDisplay = (date: Date) => {
    try {
      console.log('[AssignmentFormFields] Formatting date:', date);
      const locale = currentLanguage === 'da' ? da : undefined;
      
      // Create a new date in local timezone to prevent shifts
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const formatted = format(localDate, "PPP", { locale });
      console.log('[AssignmentFormFields] Formatted date:', formatted);
      return formatted;
    } catch (e) {
      console.error("Error formatting date:", e);
      return format(date, "PPP");
    }
  };

  // FIXED: Handle multi-date selection
  const handleDateSelect = (dates: Date[] | undefined) => {
    console.log('[AssignmentFormFields] Dates selected from calendar:', dates);
    if (dates && dates.length > 0) {
      // Use local date methods instead of UTC to prevent timezone shifts
      const localDates = dates.map(date => {
        const localYear = date.getFullYear();
        const localMonth = date.getMonth();
        const localDay = date.getDate();
        return new Date(localYear, localMonth, localDay);
      });
      console.log('[AssignmentFormFields] Created timezone-safe dates:', localDates);
      setSelectedDates(localDates);
    } else {
      setSelectedDates([]);
    }
  };

  const handleRemoveDate = (dateToRemove: Date) => {
    console.log('[AssignmentFormFields] Removing date:', dateToRemove);
    console.log('[AssignmentFormFields] Current dates:', selectedDates);
    
    // Compare dates as strings (YYYY-MM-DD) instead of timestamps
    const dateToRemoveStr = format(dateToRemove, 'yyyy-MM-dd');
    const updatedDates = selectedDates.filter(d => {
      const dStr = format(d, 'yyyy-MM-dd');
      return dStr !== dateToRemoveStr;
    });
    
    console.log('[AssignmentFormFields] Updated dates after removal:', updatedDates);
    setSelectedDates(updatedDates);
  };

  // Show responsible user field only for admin and skadeleder
  const canAssignResponsibleUser = isAdmin || isSkadeleder;

  // FIXED: Enhanced car selection with better validation for multiple cars
  const handleCarToggle = (carId: string) => {
    console.log('[AssignmentFormFields] Car toggle handler called:', {
      carId,
      carType: typeof carId,
      isEmpty: carId === '' || !carId,
      currentSelection: selectedCarIds
    });
    
    const currentCars = selectedCarIds || [];
    let updatedCars;
    
    if (currentCars.includes(carId)) {
      updatedCars = currentCars.filter(id => id !== carId);
      console.log('[AssignmentFormFields] Removing car:', carId);
    } else {
      updatedCars = [...currentCars, carId];
      console.log('[AssignmentFormFields] Adding car:', carId);
    }
    
    console.log('[AssignmentFormFields] Setting updated car IDs:', updatedCars);
    setSelectedCarIds(updatedCars);
  };

  // FIXED: Enhanced employee selection with validation - now uses employee IDs
  const handleEmployeeToggle = (employeeId: string) => {
    console.log('[AssignmentFormFields] Employee toggled:', employeeId);
    console.log('[AssignmentFormFields] Current employees:', selectedEmployees);
    
    if (!employeeId || employeeId.trim() === '') {
      console.warn('[AssignmentFormFields] Invalid employee ID provided');
      return;
    }
    
    console.log('[AssignmentFormFields] Calling onEmployeeToggle with:', employeeId);
    onEmployeeToggle(employeeId);
  };

  return (
    <div className="space-y-4">
      {/* Title Field - Updated to use enterTitle translation */}
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

      {/* Location Field with Address Autocomplete */}
      <div className="space-y-2">
        <Label htmlFor="location">{t('planner.location')}</Label>
        <AddressAutocomplete
          value={location}
          onChange={setLocation}
          onRouteInfoChange={onRouteInfoChange}
          placeholder={t('planner.enterLocation')}
          required
        />
      </div>

      {/* Date Field - Multi-date selector for both create and edit modes */}
      <div className="space-y-2">
        <Label>{t('planner.selectMultipleDates')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDates.length > 0 
                ? t('planner.datesSelected', { count: selectedDates.length })
                : t('common.selectDate')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={handleDateSelect}
              initialFocus
              locale={currentLanguage === 'da' ? da : undefined}
              className="pointer-events-auto"
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
            />
          </PopoverContent>
        </Popover>
        {/* Display selected dates as removable badges */}
        {selectedDates.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedDates.map((date, index) => (
              <div 
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
              >
                <span>{formatDateDisplay(date)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDate(date)}
                  className="ml-1 hover:text-destructive"
                  aria-label={t('planner.removeDate')}
                >
                  ×
                </button>
              </div>
            ))}
            {selectedDates.length > 1 && (
              <button
                type="button"
                onClick={() => setSelectedDates([])}
                className="px-2 py-1 text-xs text-muted-foreground hover:text-destructive underline"
              >
                {t('planner.clearDates')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Time Fields - Updated to use startTime and endTime translations */}
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
        onToggle={onEmployeeToggle}
        vacations={vacations}
        currentDate={currentDateStr}
        assignments={assignments}
      />

      {/* Responsible User Selector - Updated to use responsibleUser translation */}
      {canAssignResponsibleUser && (
        <ResponsibleUserSelector
          selectedUserId={selectedResponsibleUserId}
          onUserSelect={(userId) => {
            console.log('[AssignmentFormFields] Responsible user selected:', userId);
            setSelectedResponsibleUserId(userId);
          }}
        />
      )}

      {/* Multiple Car Selector with enhanced error handling */}
      <div className="space-y-2">
        <MultipleCarSelector
          cars={cars.filter(car => car.show_in_planner !== false)}
          selectedCarIds={selectedCarIds}
          onCarToggle={handleCarToggle}
          currentDate={currentDateStr}
          assignments={assignments}
          currentAssignmentId={assignmentId}
        />
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('planner.assignmentDescription')}</Label>
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
