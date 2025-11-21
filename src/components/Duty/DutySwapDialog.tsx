import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';
import type { Duty } from '@/types/duty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Car } from 'lucide-react';

interface DutySwapDialogProps {
  duty: Duty | null;
  employees: Array<{ id: string; name: string; role: string; avatar_url?: string; jobTitle?: string; status?: string; onLeave?: boolean }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReassign: (dutyId: string, newEmployeeId: string) => Promise<boolean>;
}

export function DutySwapDialog({ duty, employees, open, onOpenChange, onReassign }: DutySwapDialogProps) {
  const { t } = useTranslation();
  
  if (!duty) return null;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedEmployeeId("");
  }, [open, duty?.id]);

  const eligibleEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (emp.id === duty.employee_id) return false;
      if (emp.status === 'on_leave' || emp.status === 'inactive' || emp.status === 'terminated' || emp.onLeave) {
        return false;
      }
      if (duty.duty_type === 'skadeleder_vagt') {
        return emp.role === 'administrator' || emp.role === 'skadeleder';
      }
      return true;
    });
  }, [employees, duty]);

  const selectedEmployee = selectedEmployeeId 
    ? eligibleEmployees.find(e => e.id === selectedEmployeeId) 
    : null;

  const getDutyIcon = (dutyType: string) => {
    return dutyType === 'skadeleder_vagt' ? <Phone className="h-5 w-5 text-primary" /> : <Car className="h-5 w-5 text-primary" />;
  };

  const getDutyTypeLabel = (dutyType: string) => {
    return dutyType === 'skadeleder_vagt' ? t('duty.skadelederVagt') : t('duty.kørevagt');
  };

  const formatDutyDate = (date: string) => {
    return format(new Date(date), 'EEEE d. MMMM', { locale: da });
  };

  const handleAssignClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmReassign = async () => {
    if (!selectedEmployeeId) return;
    
    setLoading(true);
    const success = await onReassign(duty.id, selectedEmployeeId);
    setLoading(false);
    
    if (success) {
      setConfirmOpen(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedEmployeeId("");
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t('duty.assignDuty')}</DialogTitle>
            <DialogDescription>
              {t('duty.selectEmployeeToAssignTo')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                    {getDutyIcon(duty.duty_type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{getDutyTypeLabel(duty.duty_type)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDutyDate(duty.duty_date)}
                    </p>
                    {duty.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{duty.notes}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <Label className="mb-3 block font-semibold">{t('duty.selectEmployeeToAssignTo')}</Label>
              
              {eligibleEmployees.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">
                      {t('duty.noEligibleEmployees')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <RadioGroup value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    {eligibleEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center space-x-2 mb-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <RadioGroupItem value={employee.id} id={`emp-${employee.id}`} />
                        <Label htmlFor={`emp-${employee.id}`} className="flex items-center gap-3 cursor-pointer flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={employee.avatar_url} />
                            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{employee.name}</p>
                            {employee.jobTitle && (
                              <p className="text-xs text-muted-foreground">{employee.jobTitle}</p>
                            )}
                          </div>
                          <Badge variant="outline">{employee.role}</Badge>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleAssignClick}
              disabled={!selectedEmployeeId || loading}
            >
              {loading ? t('common.loading') : t('duty.assignDuty')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('duty.confirmReassignment')}</AlertDialogTitle>
              <AlertDialogDescription>
              {selectedEmployee && (
                <p className="mt-4">
                  Er du sikker på at du vil tildele denne {getDutyTypeLabel(duty.duty_type)} vagt den {formatDutyDate(duty.duty_date)} til {selectedEmployee.name}?
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmReassign}
              disabled={loading}
            >
              {loading ? t('common.loading') : t('duty.assignDuty')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
