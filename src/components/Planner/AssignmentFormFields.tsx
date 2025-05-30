
import React from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { Car } from '@/types/car';
import { Assignment } from '@/types/assignment';
import { CarSelector } from './CarSelector';

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
  assignmentType: string;
  setAssignmentType: (value: string) => void;
  selectedCarId: string;
  setSelectedCarId: (value: string) => void;
  cars: Car[];
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
  assignmentType,
  setAssignmentType,
  selectedCarId,
  setSelectedCarId,
  cars,
  assignmentId,
  assignments = []
}) => {
  const { t, currentLanguage } = useTranslation();

  const assignmentTypes = [
    { value: 'ordinary_damage', label: 'Almindelig skade' },
    { value: 'flood_damage', label: 'Vandskade' },
    { value: 'roof_damage', label: 'Tagskade' },
    { value: 'storm_damage', label: 'Stormskade' },
    { value: 'fire_damage', label: 'Brandskade' },
    { value: 'other', label: 'Andet' }
  ];

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

      {/* Assignment Type */}
      <div className="space-y-2">
        <Label>{t('planner.type')}</Label>
        <Select value={assignmentType} onValueChange={setAssignmentType}>
          <SelectTrigger>
            <SelectValue placeholder={t('planner.selectType')} />
          </SelectTrigger>
          <SelectContent>
            {assignmentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Car Selector */}
      <div className="space-y-2">
        <Label>{t('planner.selectCar')}</Label>
        <CarSelector
          cars={cars}
          selectedCarId={selectedCarId}
          onCarSelect={setSelectedCarId}
          currentDate={currentDateStr}
          assignments={assignments}
          currentAssignmentId={assignmentId}
        />
      </div>

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
