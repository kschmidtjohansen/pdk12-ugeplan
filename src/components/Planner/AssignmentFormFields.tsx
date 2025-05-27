
import React, { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Car } from '@/types/car';
import { Assignment } from '@/types/assignment';
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
  const locale = currentLanguage === 'da' ? da : undefined;
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Set default end time based on whether the selected date is a Friday
  React.useEffect(() => {
    if (selectedDate && (!toTime || toTime === '16:00' || toTime === '15:30')) {
      const defaultEnd = getDefaultEndTime(selectedDate);
      setToTime(defaultEnd);
    }
  }, [selectedDate, toTime, setToTime]);

  // Helper function to format time to HH:MM without seconds
  const formatTimeWithoutSeconds = (time: string): string => {
    if (time && time.length === 8 && time.includes(':')) {
      return time.substring(0, 5);
    }
    return time;
  };

  // Helper function to check if a car is used on the selected date
  const getCarUsageInfo = (carId: string) => {
    if (!selectedDate || !assignments) return null;
    
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const carAssignments = assignments.filter(assignment => 
      assignment.date === dateString && 
      (typeof assignment.car === 'string' ? assignment.car === carId : assignment.car?.id === carId) &&
      assignment.id !== assignmentId
    );
    
    if (carAssignments.length === 0) return null;
    
    const hasEndTimeAtSixteen = carAssignments.some(assignment => assignment.toTime === "16:00");
    
    const timeRanges = carAssignments.map(assignment => 
      `${formatTimeWithoutSeconds(assignment.fromTime)}-${formatTimeWithoutSeconds(assignment.toTime)}`
    );
    
    return {
      isUsed: true,
      timeRanges: timeRanges.join(', '),
      hasEndTimeAtSixteen
    };
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="location">
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

      <div>
        <Label htmlFor="title">
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
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                onSelect={(date) => {
                  setSelectedDate(date);
                  setCalendarOpen(false);
                }}
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
              .filter(car => car.is_available)
              .map((car) => {
                const usageInfo = getCarUsageInfo(car.id);
                return (
                  <SelectItem key={car.id} value={car.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{car.car_number} - {car.name}</span>
                      {usageInfo?.isUsed && (
                        <span className={`ml-2 px-2 py-1 text-xs rounded font-medium ${
                          usageInfo.hasEndTimeAtSixteen 
                            ? 'bg-red-600 text-white border border-red-700' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        }`}>
                          {t('planner.used')} ({usageInfo.timeRanges})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
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
