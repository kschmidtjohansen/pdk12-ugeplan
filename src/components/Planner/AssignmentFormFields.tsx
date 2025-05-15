
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import { Car } from '@/types/car';

interface AssignmentFormFieldsProps {
  formData: any;
  onFieldChange: (field: string, value: any) => void;
  cars: Car[];
  employees: Employee[];
}

const AssignmentFormFields: React.FC<AssignmentFormFieldsProps> = ({
  formData,
  onFieldChange,
  cars,
  employees
}) => {
  const {
    t,
    currentLanguage
  } = useTranslation();

  // Always get the current date for consistently up-to-date references
  const currentDate = new Date();
  console.log("AssignmentFormFields - Current system date:", format(currentDate, "yyyy-MM-dd"));
  console.log("AssignmentFormFields - Input formData.date:", formData.date);

  // Helper function to safely handle date formatting
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      console.log("formatDate: No date provided, using current date");
      return format(currentDate, "yyyy-MM-dd");
    }
    
    try {
      // Use Danish locale if the current language is Danish
      const locale = currentLanguage === 'da' ? da : undefined;
      const formattedDate = format(new Date(dateString), "yyyy-MM-dd", {
        locale
      });
      console.log(`formatDate: Successfully formatted ${dateString} to ${formattedDate}`);
      return formattedDate;
    } catch (e) {
      console.error("formatDate: Invalid date format:", dateString, e);
      return format(currentDate, "yyyy-MM-dd");
    }
  };

  // Format date for display in the calendar button
  const formatDisplayDate = (dateString: string | undefined | null) => {
    console.log("formatDisplayDate called with:", dateString);
    
    // Ensure we have a valid date to work with
    let dateToFormat: Date;
    
    if (dateString && dateString.trim() !== '') {
      try {
        // Parse the provided date string
        dateToFormat = new Date(dateString);
        
        // Check if the date is valid
        if (isNaN(dateToFormat.getTime())) {
          console.warn("formatDisplayDate: Invalid date provided:", dateString);
          dateToFormat = currentDate; // Fallback to current date
        }
      } catch (e) {
        console.error("formatDisplayDate: Error parsing date:", e);
        dateToFormat = currentDate;
      }
    } else {
      console.log("formatDisplayDate: No date provided, using current date");
      dateToFormat = currentDate; // No date provided, use current date
    }
    
    // Use Danish locale if the current language is Danish
    const locale = currentLanguage === 'da' ? da : undefined;
    const result = format(dateToFormat, "d MMMM yyyy", { locale });
    console.log("formatDisplayDate: Returning formatted date:", result);
    return result;
  };

  // Helper function to handle calendar date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      try {
        const formattedDate = format(date, 'yyyy-MM-dd');
        console.log("handleDateSelect: Selected date:", formattedDate);
        onFieldChange('date', formattedDate);
      } catch (e) {
        console.error("handleDateSelect: Error formatting date:", e);
      }
    } else {
      console.log("handleDateSelect: No date selected");
    }
  };

  // Debug to see what's in formData
  console.log("FormFields - Current formData:", formData);
  console.log("FormFields - Cars data:", cars?.length || 0, "cars available");
  console.log("FormFields - Employees data:", employees?.length || 0, "employees available");
  console.log("FormFields - Current date:", format(currentDate, "yyyy-MM-dd"));
  
  // Determine the date to display in the calendar
  // If formData.date is not valid, use current date
  let calendarDate: Date;
  try {
    calendarDate = formData.date ? new Date(formData.date) : currentDate;
    if (isNaN(calendarDate.getTime())) {
      console.warn("Invalid calendar date detected, using current date instead");
      calendarDate = currentDate;
    }
  } catch (e) {
    console.error("Error parsing calendar date:", e);
    calendarDate = currentDate;
  }
  
  console.log("Calendar will display date:", format(calendarDate, "yyyy-MM-dd"));
  
  // Wrap the returned JSX in a fragment to fix the React error #185
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="title">{t('planner.assignmentTitle')}</Label>
        <Input id="title" name="title" value={formData.title || ''} onChange={e => onFieldChange('title', e.target.value)} />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="description">{t('planner.description')}</Label>
        <Textarea id="description" name="description" value={formData.description || ''} onChange={e => onFieldChange('description', e.target.value)} />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="date">{t('planner.date')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              type="button" 
              variant={"outline"} 
              className={"w-[280px] justify-start text-left font-normal text-foreground"}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDisplayDate(formData.date)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar 
              mode="single" 
              selected={calendarDate} 
              onSelect={handleDateSelect} 
              locale={currentLanguage === 'da' ? da : undefined} 
              weekStartsOn={1} // 1 means Monday is the first day
              className="rounded-md border p-3 pointer-events-auto" 
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fromTime">{t('planner.from')}</Label>
          <Input type="time" id="fromTime" name="fromTime" value={formData.fromTime || '08:00'} onChange={e => onFieldChange('fromTime', e.target.value)} />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="toTime">{t('planner.to')}</Label>
          <Input type="time" id="toTime" name="toTime" value={formData.toTime || '16:00'} onChange={e => onFieldChange('toTime', e.target.value)} />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="location">{t('planner.location')}</Label>
        <Input id="location" name="location" value={formData.location || ''} onChange={e => onFieldChange('location', e.target.value)} />
      </div>

      {cars && cars.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor="car">{t('planner.car')}</Label>
          <Select 
            value={typeof formData.car === 'string' ? formData.car : formData.car?.id || ''} 
            onValueChange={value => onFieldChange('car', value)}
          >
            <SelectTrigger id="car">
              <SelectValue placeholder={t('planner.selectCar')} />
            </SelectTrigger>
            <SelectContent>
              {cars.map(car => (
                <SelectItem key={car.id} value={car.id}>
                  {car.car_number} - {car.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
};

export default AssignmentFormFields;
