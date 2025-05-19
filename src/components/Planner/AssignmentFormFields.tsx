
import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { format, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { CalendarIcon, MapPin, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Car } from '@/types/car';
import { useTranslation } from '@/context/TranslationContext';
import { getDefaultEndTime, isFriday } from '@/utils/dateUtils';

interface AssignmentFormFieldsProps {
  title: string;
  setTitle: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  selectedDate: Date | undefined;
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
  assignmentType, // kept for backward compatibility
  setAssignmentType, // kept for backward compatibility
  selectedCarId,
  setSelectedCarId,
  cars,
  assignmentId
}) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : undefined;

  // Set default end time based on whether the selected date is a Friday
  React.useEffect(() => {
    if (selectedDate && (!toTime || toTime === '16:00' || toTime === '15:30')) {
      const defaultEnd = getDefaultEndTime(selectedDate);
      setToTime(defaultEnd);
    }
  }, [selectedDate, toTime, setToTime]);

  return (
    <div className="space-y-4">
      {/* Location field - now in the position of the title */}
      <div>
        <Label htmlFor="location" className="flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          {t('planner.location')}
        </Label>
        <Input 
          id="location" 
          value={location} 
          onChange={(e) => setLocation(e.target.value)} 
          placeholder={t('planner.enterLocation')}
          required
        />
      </div>

      {/* Title field - now in the position of the location (case number) */}
      <div>
        <Label htmlFor="title" className="flex items-center">
          <Tag className="h-4 w-4 mr-2" />
          {t('planner.title')}
        </Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder={t('planner.title')}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>{t('planner.assignmentDate')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale }) : <span>{t('planner.assignmentDate')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={locale}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fromTime">{t('planner.startTime')}</Label>
          <Input
            id="fromTime"
            type="time"
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            placeholder="08:00"
            required
          />
        </div>
        <div>
          <Label htmlFor="toTime">{t('planner.endTime')}</Label>
          <Input
            id="toTime"
            type="time"
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            placeholder={selectedDate && isFriday(selectedDate) ? "15:30" : "16:00"}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="car">{t('planner.selectCar')}</Label>
        <Select value={selectedCarId} onValueChange={setSelectedCarId}>
          <SelectTrigger>
            <SelectValue placeholder={t('planner.selectCar')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('common.none')}</SelectItem>
            {cars
              .filter(car => car.is_available) // Only show available cars
              .map((car) => (
                <SelectItem key={car.id} value={car.id}>
                  {car.car_number} - {car.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">{t('planner.notes')}</Label>
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
