
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car } from '@/types/car';
import { useCars } from '@/hooks/car';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import CarSelector from './CarSelector';
import { EmployeeSelector } from './EmployeeSelector';
import { Employee } from '@/types/employee';
import { useEmployees } from '@/hooks/useEmployees';

interface AssignmentFormProps {
  assignment?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ assignment, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const { cars } = useCars();
  const { employees } = useEmployees();

  const [title, setTitle] = useState(assignment?.title || '');
  const [description, setDescription] = useState(assignment?.description || '');
  const [date, setDate] = useState<Date | undefined>(assignment?.date ? new Date(assignment.date) : undefined);
  const [fromTime, setFromTime] = useState(assignment?.fromTime || '08:00');
  const [toTime, setToTime] = useState(assignment?.toTime || '16:00');
  const [location, setLocation] = useState(assignment?.location || '');
  const [selectedCar, setSelectedCar] = useState<string | undefined>(assignment?.carId || undefined);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(assignment?.employeeIds || []);

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title || '');
      setDescription(assignment.description || '');
      setDate(assignment.date ? new Date(assignment.date) : undefined);
      setFromTime(assignment.fromTime || '08:00');
      setToTime(assignment.toTime || '16:00');
      setLocation(assignment.location || '');
      setSelectedCar(assignment.carId || undefined);
      setSelectedEmployees(assignment.employeeIds || []);
    }
  }, [assignment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      alert(t('planner.selectDate'));
      return;
    }

    if (selectedEmployees.length === 0) {
      alert(t('planner.selectAtLeastOneEmployee'));
      return;
    }

    const formData = {
      id: assignment?.id,
      title,
      description,
      date: format(date, 'yyyy-MM-dd'),
      fromTime,
      toTime,
      location,
      carId: selectedCar,
      employeeIds: selectedEmployees,
      employees: employees
        .filter((employee: Employee) => selectedEmployees.includes(employee.id))
        .map((employee: Employee) => employee.name),
      published: assignment?.published || false
    };

    onSubmit(formData);
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <Label htmlFor="title">{t('planner.assignmentTitle')}</Label>
        <Input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">{t('planner.description')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div>
        <Label>{t('planner.date')}</Label>
        <DatePicker
          value={date}
          onSelect={setDate}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="from">{t('planner.from')}</Label>
          <TimePicker value={fromTime} onChange={setFromTime} />
        </div>
        <div>
          <Label htmlFor="to">{t('planner.to')}</Label>
          <TimePicker value={toTime} onChange={setToTime} />
        </div>
      </div>
      <div>
        <Label htmlFor="location">{t('planner.location')}</Label>
        <Input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="car">{t('planner.car')}</Label>
        <CarSelector
          cars={cars || []}
          selectedCar={selectedCar}
          onCarSelect={setSelectedCar}
        />
      </div>
      <div>
        <Label htmlFor="employees">{t('planner.employees')}</Label>
        <EmployeeSelector
          selectedEmployees={selectedEmployees}
          employees={employees}
          onEmployeeToggle={handleEmployeeToggle}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit">
          {assignment?.id ? t('common.save') : t('planner.createAssignment')}
        </Button>
      </div>
    </form>
  );
};

export default AssignmentForm;
