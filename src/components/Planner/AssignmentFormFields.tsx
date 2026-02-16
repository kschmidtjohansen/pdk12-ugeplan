import React, { useState } from 'react';
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
  selectedEmployees: string[];
  onEmployeeToggle: (employeeId: string) => void;
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
  cars,
  employees,
  vacations,
  assignmentId,
  assignments = [],
  isEditMode = false
}) => {
  const { t, currentLanguage } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();
  const [casePostcode, setCasePostcode] = useState('');

  if (import.meta.env.DEV) {
    console.log('[AssignmentFormFields] Car state:', { selectedCarIds });
  }

  const currentDateStr = selectedDates.length > 0 ? format(selectedDates[0], 'yyyy-MM-dd') : '';

  const formatDateDisplay = (date: Date) => {
    try {
      const locale = currentLanguage === 'da' ? da : undefined;
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return format(localDate, "PPP", { locale });
    } catch (e) {
      console.error("Error formatting date:", e);
      return format(date, "PPP");
    }
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (dates && dates.length > 0) {
      const localDates = dates.map(date => {
        const localYear = date.getFullYear();
        const localMonth = date.getMonth();
        const localDay = date.getDate();
        return new Date(localYear, localMonth, localDay);
      });
      setSelectedDates(localDates);
    } else {
      setSelectedDates([]);
    }
  };

  const handleRemoveDate = (dateToRemove: Date) => {
    const dateToRemoveStr = format(dateToRemove, 'yyyy-MM-dd');
    const updatedDates = selectedDates.filter(d => {
      const dStr = format(d, 'yyyy-MM-dd');
      return dStr !== dateToRemoveStr;
    });
    setSelectedDates(updatedDates);
  };

  const canAssignResponsibleUser = isAdmin || isSkadeleder;

  const handleCarToggle = (carId: string) => {
    const currentCars = selectedCarIds || [];
    let updatedCars;
    
    if (currentCars.includes(carId)) {
      updatedCars = currentCars.filter(id => id !== carId);
    } else {
      updatedCars = [...currentCars, carId];
    }
    
    setSelectedCarIds(updatedCars);
  };

  const handleEmployeeToggle = (employeeId: string) => {
    if (!employeeId || employeeId.trim() === '') {
      if (import.meta.env.DEV) console.warn('[AssignmentFormFields] Invalid employee ID');
      return;
    }
    onEmployeeToggle(employeeId);
  };

  return (
    <div className="space-y-4">
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

      <div className="space-y-2">
        <Label htmlFor="casePostcode">{t('planner.casePostcode')}</Label>
        <Input
          id="casePostcode"
          value={casePostcode}
          onChange={(e) => setCasePostcode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder={t('planner.casePostcodePlaceholder')}
          maxLength={4}
          inputMode="numeric"
        />
      </div>

      <EmployeeSelector
        employees={employees}
        selectedEmployees={selectedEmployees}
        onToggle={onEmployeeToggle}
        vacations={vacations}
        currentDate={currentDateStr}
        assignments={assignments}
        casePostcode={casePostcode}
      />

      {canAssignResponsibleUser && (
        <ResponsibleUserSelector
          selectedUserId={selectedResponsibleUserId}
          onUserSelect={(userId) => setSelectedResponsibleUserId(userId)}
        />
      )}

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

      <div className="space-y-2">
        <Label htmlFor="description">{t('planner.assignmentDescription')}</Label>
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
