
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from '@/context/TranslationContext';
import EmployeeSelector from './EmployeeSelector';
import { Car } from '@/types/car';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';

interface AssignmentFormFieldsProps {
  formData: any;
  selectedEmployees: string[];
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleEmployeeToggle: (employeeName: string) => void;
}

const AssignmentFormFields: React.FC<AssignmentFormFieldsProps> = ({
  formData,
  selectedEmployees,
  cars,
  employees,
  vacations,
  handleInputChange,
  handleSelectChange,
  handleEmployeeToggle,
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">{t("planner.assignmentTitle")}</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">{t("planner.description")}</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">{t("planner.date")}</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">{t("planner.location")}</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromTime">{t("planner.from")}</Label>
          <Input
            id="fromTime"
            name="fromTime"
            type="time"
            value={formData.fromTime}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="toTime">{t("planner.to")}</Label>
          <Input
            id="toTime"
            name="toTime"
            type="time"
            value={formData.toTime}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="car">{t("planner.car")}</Label>
        <Select
          value={formData.car}
          onValueChange={(value) => handleSelectChange('car', value)}
          required
        >
          <SelectTrigger id="car">
            <SelectValue placeholder={t("planner.selectCar")} />
          </SelectTrigger>
          <SelectContent>
            {cars.map((car) => (
              <SelectItem key={car.id} value={car.name}>
                {car.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="employees">{t("planner.employees")}</Label>
        <EmployeeSelector 
          employees={employees}
          selectedEmployees={selectedEmployees}
          onToggle={handleEmployeeToggle}
          vacations={vacations}
          currentDate={formData.date}
        />
        {selectedEmployees.length === 0 && (
          <p className="text-sm text-red-500">{t("planner.selectAtLeastOneEmployee")}</p>
        )}
      </div>
    </div>
  );
};

export default AssignmentFormFields;
