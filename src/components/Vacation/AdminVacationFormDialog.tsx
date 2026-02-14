
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
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { VacationRequestType } from '@/types/vacation';
import VacationDateSelector from './VacationDateSelector';
import SeparateVacationDateFields from './SeparateVacationDateFields';
import { Textarea } from '@/components/ui/textarea';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/context/AuthContext';
import { useDepartment } from '@/context/DepartmentContext';
import { supabase } from '@/integrations/supabase/client';

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
  // New props for separate date fields
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  useSeparateDateFields?: boolean;
  // New props for request type and times
  requestType: VacationRequestType;
  setRequestType: (type: VacationRequestType) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
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
  setSelectedEmployeeId,
  // New props for separate date fields
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  useSeparateDateFields = true,
  // New props for request type and times
  requestType,
  setRequestType,
  startTime,
  setStartTime,
  endTime,
  setEndTime
}) => {
  const { t } = useTranslation();
  const { employees } = useEmployees();
  const { user } = useAuth();
  const { selectedSubDepartmentId, selectedDepartmentId } = useDepartment();
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  
  // Filter employees by sub-department when applicable
  useEffect(() => {
    if (!employees || !open) return;
    
    if (selectedSubDepartmentId) {
      // Fetch user_access for this sub-department and filter
      supabase.from('user_access')
        .select('user_id')
        .eq('department_id', selectedDepartmentId)
        .eq('sub_department_id', selectedSubDepartmentId)
        .then(({ data }) => {
          const subDeptUserIds = new Set((data || []).map(a => a.user_id));
          const filtered = employees.filter(emp => 
            subDeptUserIds.has(emp.id)
          );
          setAvailableEmployees(filtered);
          if (filtered.length > 0 && !filtered.find(e => e.id === selectedEmployeeId)) {
            setSelectedEmployeeId(filtered[0].id);
          }
        });
    } else {
      const filtered = employees;
      setAvailableEmployees(filtered);
      if (filtered.length > 0 && !filtered.find(e => e.id === selectedEmployeeId)) {
        setSelectedEmployeeId(filtered[0].id);
      }
    }
  }, [employees, user?.id, selectedSubDepartmentId, selectedDepartmentId, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate partial day times
    if (requestType === 'partial_day' && (!startTime || !endTime)) {
      return;
    }
    
    if (requestType === 'partial_day' && startTime >= endTime) {
      return;
    }
    
    onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("vacation.requestForEmployee")}</DialogTitle>
          <DialogDescription>
            {t("vacation.selectEmployeeAndDates")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Request Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('vacation.requestType')}</Label>
            <RadioGroup 
              value={requestType} 
              onValueChange={(value) => setRequestType(value as VacationRequestType)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full_day" id="admin_full_day" />
                <Label htmlFor="admin_full_day" className="cursor-pointer">
                  {t('vacation.fullDay')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial_day" id="admin_partial_day" />
                <Label htmlFor="admin_partial_day" className="cursor-pointer">
                  {t('vacation.partialDay')}
                </Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              {requestType === 'full_day' ? t('vacation.fullDayDescription') : t('vacation.partialDayDescription')}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>{t("vacation.dateRange")}</Label>
            {useSeparateDateFields ? (
              <SeparateVacationDateFields
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={onStartDateChange}
                onEndDateChange={onEndDateChange}
              />
            ) : (
              <VacationDateSelector date={date} setDate={setDate} />
            )}
          </div>

          {/* Time Selection for Partial Days */}
          {requestType === 'partial_day' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">{t('vacation.workingHours')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_startTime">{t('vacation.startTime')}</Label>
                  <Input
                    id="admin_startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_endTime">{t('vacation.endTime')}</Label>
                  <Input
                    id="admin_endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              {startTime && endTime && startTime >= endTime && (
                <p className="text-sm text-destructive">{t('vacation.invalidTimeRange')}</p>
              )}
            </div>
          )}
          
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
            <Button 
              type="submit" 
              className="bg-polygon-purple hover:bg-polygon-darkpurple"
              disabled={requestType === 'partial_day' && (!startTime || !endTime || startTime >= endTime)}
            >
              {t("vacation.submitRequest")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminVacationFormDialog;
