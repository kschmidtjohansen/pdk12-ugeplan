
import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { useTranslation } from '@/context/TranslationContext';
import { Employee } from '@/types/employee';
import VacationDateSelector from './VacationDateSelector';
import { Textarea } from '@/components/ui/textarea';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/context/AuthContext';

interface AdminVacationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: DateRange;
  setDate: (date: DateRange) => void;
  reason: string;
  setReason: (reason: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
}

const AdminVacationFormDialog: React.FC<AdminVacationFormDialogProps> = ({
  open,
  onOpenChange,
  date,
  setDate,
  reason,
  setReason,
  onSubmit,
  selectedEmployeeId,
  setSelectedEmployeeId
}) => {
  const { t } = useTranslation();
  const { employees } = useEmployees();
  const { user } = useAuth();
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  
  // Filter out the current user from the employee list
  useEffect(() => {
    if (employees) {
      const filtered = employees.filter(emp => emp.id !== user?.id);
      setAvailableEmployees(filtered);
      
      // If no employee is selected, select the first one by default
      if (!selectedEmployeeId && filtered.length > 0) {
        setSelectedEmployeeId(filtered[0].id);
      }
    }
  }, [employees, user?.id, selectedEmployeeId, setSelectedEmployeeId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("vacation.requestForEmployee")}</DialogTitle>
          <DialogDescription>
            {t("vacation.selectEmployeeAndDates")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("vacation.selectEmployee")}</Label>
            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("vacation.selectEmployee")} />
              </SelectTrigger>
              <SelectContent>
                {availableEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>{t("vacation.dateRange")}</Label>
            <VacationDateSelector date={date} setDate={setDate} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">{t("vacation.reason")}</Label>
            <Textarea 
              id="reason" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder={t("vacation.reasonPlaceholder")} 
              required 
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="bg-polygon-purple hover:bg-polygon-darkpurple">
              {t("vacation.submitRequest")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminVacationFormDialog;
