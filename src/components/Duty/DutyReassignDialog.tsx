import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/context/TranslationContext';
import { useEmployeeData } from '@/hooks/employee/useEmployeeData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Phone, Car } from 'lucide-react';
import type { Duty } from '@/types/duty';

interface DutyReassignDialogProps {
  duty: Duty | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReassign: (dutyId: string, newEmployeeId: string, reason?: string) => Promise<void>;
}

export const DutyReassignDialog: React.FC<DutyReassignDialogProps> = ({
  duty,
  open,
  onOpenChange,
  onReassign,
}) => {
  const { t, currentLanguage } = useTranslation();
  const { employees } = useEmployeeData();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locale = currentLanguage === 'da' ? da : enUS;

  // Filter employees based on duty type
  const availableEmployees = employees.filter(emp => {
    if (emp.status !== 'active') return false;
    if (!duty) return false;
    if (duty.employee_id === emp.id) return false; // Don't show current assignee
    
    // For skadeleder_vagt, only show administrators and skadeledere
    if (duty.duty_type === 'skadeleder_vagt') {
      return emp.role === 'administrator' || emp.role === 'skadeleder';
    }
    
    return true;
  });

  const handleSubmit = async () => {
    if (!duty || !selectedEmployeeId) return;

    setIsSubmitting(true);
    try {
      await onReassign(duty.id, selectedEmployeeId, reason || undefined);
      setSelectedEmployeeId('');
      setReason('');
      onOpenChange(false);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error reassigning duty:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployeeId('');
    setReason('');
    onOpenChange(false);
  };

  if (!duty) return null;

  const dutyTypeLabel = duty.duty_type === 'skadeleder_vagt' 
    ? t('duty.skadelederVagt')
    : t('duty.kørevagt');

  const formattedDate = format(new Date(duty.duty_date), 'EEEE d. MMMM yyyy', { locale });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('duty.reassignDuty')}</DialogTitle>
          <DialogDescription>
            {t('duty.selectNewEmployee')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current duty info */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                {duty.duty_type === 'skadeleder_vagt' ? (
                  <Phone className="h-3 w-3" />
                ) : (
                  <Car className="h-3 w-3" />
                )}
                {dutyTypeLabel}
              </Badge>
              <span className="text-sm text-muted-foreground">{formattedDate}</span>
            </div>
            
            {duty.employee && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-sm font-medium">{t('duty.currentAssignee')}:</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={duty.employee.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(duty.employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{duty.employee.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* New employee selector */}
          <div className="space-y-2">
            <Label htmlFor="employee">{t('duty.newAssignee')}</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger id="employee">
                <SelectValue placeholder={t('duty.selectNewEmployee')} />
              </SelectTrigger>
              <SelectContent>
                {availableEmployees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={employee.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{employee.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason field */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t('duty.reassignReason')}</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('duty.enterName')}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {t('duty.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedEmployeeId || isSubmitting}
          >
            {isSubmitting ? t('common.saving') : t('duty.reassign')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
