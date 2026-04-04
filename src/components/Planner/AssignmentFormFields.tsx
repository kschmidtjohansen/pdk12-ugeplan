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
import AddressAutocomplete from './AddressAutocomplete';
import { fetchPostnrCoords } from '@/hooks/useDawaPostnrLookup';

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
  zipCode: string;
  setZipCode: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
  onCoordsChange?: (lat: number | undefined, lng: number | undefined) => void;
  initialLat?: number;
  initialLng?: number;
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
  isEditMode = false,
  zipCode,
  setZipCode,
  city,
  setCity,
  onCoordsChange,
  initialLat,
  initialLng
}) => {
  const { t, currentLanguage } = useTranslation();
  const { isAdmin, isSkadeleder } = usePermissions();

  const extractPostcode = (loc: string) => {
    const match = loc.match(/,\s*(\d{4})\s/);
    return match ? match[1] : '';
  };

  const [casePostcode, setCasePostcode] = useState(zipCode || extractPostcode(location) || '');
  const [caseLat, setCaseLat] = useState<number | undefined>(initialLat);
  const [caseLng, setCaseLng] = useState<number | undefined>(initialLng);

  // Sync casePostcode when location is loaded (e.g. edit mode) and no zipCode exists
  React.useEffect(() => {
    if (!casePostcode && location) {
      const extracted = extractPostcode(location);
      if (extracted) {
        setCasePostcode(extracted);
        setZipCode(extracted);
      }
    }
  }, [location]);

  // Auto-fetch coordinates in edit-mode when caseLat/caseLng are missing
  React.useEffect(() => {
    if (caseLat == null && caseLng == null) {
      const postcode = zipCode || extractPostcode(location);
      if (postcode) {
        fetchPostnrCoords(postcode).then(coords => {
          if (coords) {
            setCaseLat(coords.lat);
            setCaseLng(coords.lng);
            onCoordsChange?.(coords.lat, coords.lng);
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

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
      if (import.meta.env.DEV) console.error("Error formatting date:", e);
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
        <AddressAutocomplete
          value={location}
          onChange={(val) => {
            setLocation(val);
            // Extract postcode from manual input (format: "Street, 7000 City")
            const match = val.match(/,\s*(\d{4})\s/);
            if (match) {
              setCasePostcode(match[1]);
              setZipCode(match[1]);
              // Fetch coords for the extracted postcode
              fetchPostnrCoords(match[1]).then(coords => {
                onCoordsChange?.(coords?.lat, coords?.lng);
                setCaseLat(coords?.lat);
                setCaseLng(coords?.lng);
              });
            }
          }}
          onAddressSelect={(data) => {
            setLocation(data.address);
            setCasePostcode(data.zipCode);
            setZipCode(data.zipCode);
            setCity(data.city);
            // Use coords directly from DAWA autocomplete response (no extra API call)
            if (data.lat !== undefined && data.lng !== undefined) {
              onCoordsChange?.(data.lat, data.lng);
              setCaseLat(data.lat);
              setCaseLng(data.lng);
            } else {
              // Fallback: fetch coords if not available in autocomplete response
              fetchPostnrCoords(data.zipCode).then(coords => {
                onCoordsChange?.(coords?.lat, coords?.lng);
                setCaseLat(coords?.lat);
                setCaseLng(coords?.lng);
              });
            }
          }}
          placeholder={t('planner.enterLocation')}
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
          <Label htmlFor="fromTime">{t('planner.fromTime')}</Label>
          <Input
            id="fromTime"
            type="time"
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toTime">{t('planner.toTime')}</Label>
          <Input
            id="toTime"
            type="time"
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
          />
        </div>
      </div>

      <EmployeeSelector
        employees={employees}
        selectedEmployees={selectedEmployees}
        onToggle={onEmployeeToggle}
        vacations={vacations}
        currentDate={currentDateStr}
        assignments={assignments}
        casePostcode={casePostcode}
        caseLat={caseLat}
        caseLng={caseLng}
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
