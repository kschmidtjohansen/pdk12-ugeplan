
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface AssignmentManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: Assignment | null;
  onSave: (assignmentData: Partial<Assignment>) => void;
  mode: 'create' | 'edit';
}

const AssignmentManagementDialog: React.FC<AssignmentManagementDialogProps> = ({
  isOpen,
  onClose,
  assignment,
  onSave,
  mode
}) => {
  const { t } = useTranslation();
  const { employees } = useEmployees();
  const { cars } = useCars();

  const [formData, setFormData] = useState<Partial<Assignment>>(() => ({
    title: assignment?.title || '',
    description: assignment?.description || '',
    location: assignment?.location || '',
    date: assignment?.date || new Date().toISOString().split('T')[0],
    fromTime: assignment?.fromTime || '08:00',
    toTime: assignment?.toTime || '16:00',
    car: assignment?.car || null,
    employees: assignment?.employees || [],
    published: assignment?.published || false
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleEmployeeToggle = (employeeName: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      employees: checked 
        ? [...(prev.employees || []), employeeName]
        : (prev.employees || []).filter(name => name !== employeeName)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('planner.newAssignment') : t('planner.editAssignment')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">{t('planner.assignmentTitle')}</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="date">{t('planner.date')}</Label>
              <Input
                id="date"
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">{t('planner.location')}</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">{t('planner.assignmentDescription')}</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromTime">{t('planner.fromTime')}</Label>
              <Input
                id="fromTime"
                type="time"
                value={formData.fromTime || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, fromTime: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="toTime">{t('planner.toTime')}</Label>
              <Input
                id="toTime"
                type="time"
                value={formData.toTime || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, toTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label>{t('planner.selectCar')}</Label>
            <Select
              value={typeof formData.car === 'string' ? formData.car : formData.car?.id || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, car: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('planner.selectCar')} />
              </SelectTrigger>
              <SelectContent>
                {cars.map((car) => (
                  <SelectItem key={car.id} value={car.id}>
                    {car.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('planner.employees')}</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
              {employees.map((employee) => (
                <div key={employee.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={employee.id}
                    checked={(formData.employees || []).includes(employee.name)}
                    onCheckedChange={(checked) => 
                      handleEmployeeToggle(employee.name, checked as boolean)
                    }
                  />
                  <Label htmlFor={employee.id} className="text-sm">
                    {employee.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="published"
              checked={formData.published || false}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, published: checked as boolean }))
              }
            />
            <Label htmlFor="published">{t('planner.published')}</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('planner.cancel')}
            </Button>
            <Button type="submit">
              {mode === 'create' ? t('planner.create') : t('planner.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentManagementDialog;
