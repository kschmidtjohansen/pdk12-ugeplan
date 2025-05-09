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
  const { t } = useTranslation();
  
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="title">{t('planner.assignmentTitle')}</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="description">{t('planner.description')}</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => onFieldChange('description', e.target.value)}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="date">{t('planner.date')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={
                "w-[280px] justify-start text-left font-normal" +
                (formData.date ? " text-foreground" : " text-muted-foreground")
              }
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.date ? (
                format(new Date(formData.date), "yyyy-MM-dd")
              ) : (
                <span>{t('planner.date')}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.date ? new Date(formData.date) : undefined}
              onSelect={(date) => {
                if (date) {
                  const formattedDate = format(date, 'yyyy-MM-dd');
                  onFieldChange('date', formattedDate);
                }
              }}
              className="rounded-md border"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fromTime">{t('planner.from')}</Label>
          <Input
            type="time"
            id="fromTime"
            value={formData.fromTime || '08:00'}
            onChange={(e) => onFieldChange('fromTime', e.target.value)}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="toTime">{t('planner.to')}</Label>
          <Input
            type="time"
            id="toTime"
            value={formData.toTime || '16:00'}
            onChange={(e) => onFieldChange('toTime', e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="location">{t('planner.location')}</Label>
        <Input
          id="location"
          value={formData.location || ''}
          onChange={(e) => onFieldChange('location', e.target.value)}
        />
      </div>

      {cars.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor="car">{t('planner.car')}</Label>
          <Select
            value={formData.car as string}
            onValueChange={(value) => onFieldChange('car', value)}
          >
            <SelectTrigger id="car">
              <SelectValue placeholder={t('planner.selectCar')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                {t('planner.selectCar')}
              </SelectItem>
              {cars.map((car) => (
                <SelectItem key={car.id} value={car.id}>
                  {car.car_number} - {car.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {employees.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor="employees">{t('planner.employees')}</Label>
          <Select
            multiple
            value={formData.employees || []}
            onValueChange={(value) => onFieldChange('employees', value)}
          >
            <SelectTrigger id="employees">
              <SelectValue placeholder={t('planner.selectEmployee')} />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.name} value={employee.name}>
                  {employee.name}
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
