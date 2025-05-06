
import React from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/context/TranslationContext';
import EmployeeSelector from './EmployeeSelector';
import { Car } from '../../types/car';
import { Employee } from '../../types/employee';
import { Vacation } from '../../types/vacation';

interface AssignmentFormProps {
  currentAssignment: any | null;
  formData: any;
  selectedEmployees: string[];
  cars: Car[];
  employees: Employee[];
  vacations: Vacation[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleEmployeeToggle: (employeeName: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  currentAssignment,
  formData,
  selectedEmployees,
  cars,
  employees,
  vacations,
  handleInputChange,
  handleSelectChange,
  handleEmployeeToggle,
  handleSubmit,
  onClose,
}) => {
  const { t } = useTranslation();
  
  // Parse the date from formData to create a Date object for the assignment date
  const assignmentDate = formData.date ? new Date(formData.date) : null;
  
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {currentAssignment ? t("planner.editAssignment") : t("planner.newAssignment")}
        </DialogTitle>
        <DialogDescription>
          {currentAssignment
            ? t("planner.updateDetails")
            : t("planner.addAssignment")}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
            onChange={handleEmployeeToggle}
            vacations={vacations}
            assignmentDate={assignmentDate}
          />
          {selectedEmployees.length === 0 && (
            <p className="text-sm text-red-500">{t("planner.selectAtLeastOneEmployee")}</p>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            {t("common.cancel")}
          </Button>
          <Button 
            type="submit"
            className="bg-polygon-purple hover:bg-polygon-darkpurple"
            disabled={selectedEmployees.length === 0}
          >
            {currentAssignment ? t("planner.saveChanges") : t("planner.createAssignment")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default AssignmentForm;
