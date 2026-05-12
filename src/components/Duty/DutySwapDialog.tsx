import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyActions } from '@/hooks/duty/useDutyActions';
import type { Duty } from '@/types/duty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Car } from 'lucide-react';

interface DutySwapDialogProps {
  duty: Duty | null;
  employees: Array<{ id: string; name: string; role: string; avatar_url?: string; jobTitle?: string; status?: string; onLeave?: boolean }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DutySwapDialog({ duty, employees, open, onOpenChange, onSuccess }: DutySwapDialogProps) {
  const { t } = useTranslation();
  const { createSwapRequest, loading } = useDutyActions(onSuccess);

  if (!duty) return null;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [open, duty?.id]);

  const eligibleEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (emp.id === duty.employee_id) return false;
      if (emp.status === 'on_leave' || emp.status === 'inactive' || emp.status === 'terminated' || emp.onLeave) {
        return false;
      }
      if (duty.duty_type === 'skadeleder_vagt') {
        return emp.role === 'administrator' || emp.role === 'skadeleder' || emp.role === 'super_admin';
      }
      return true;
    });
  }, [employees, duty]);

  const toggle = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getDutyIcon = (dutyType: string) =>
    dutyType === 'skadeleder_vagt' ? <Phone className="h-5 w-5 text-primary" /> : <Car className="h-5 w-5 text-primary" />;

  const getDutyTypeLabel = (dutyType: string) =>
    dutyType === 'skadeleder_vagt' ? t('duty.skadelederVagt') : t('duty.kørevagt');

  const formatDutyDate = (date: string) => format(new Date(date), 'EEEE d. MMMM', { locale: da });

  const handleClose = () => {
    setSelectedIds([]);
    onOpenChange(false);
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;
    const ok = await createSwapRequest(
      {
        id: duty.id,
        duty_type: duty.duty_type,
        duty_date: duty.duty_date,
        department_id: (duty as any).department_id ?? null,
      },
      selectedIds,
    );
    if (ok) handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{t('duty.swapDuty')}</DialogTitle>
          <DialogDescription>{t('duty.selectCandidates')}</DialogDescription>
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
                  <p className="text-sm text-muted-foreground">{formatDutyDate(duty.duty_date)}</p>
                  {duty.notes && <p className="text-xs text-muted-foreground mt-1">{duty.notes}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="font-semibold">{t('duty.selectCandidates')}</Label>
              {selectedIds.length > 0 && (
                <Badge variant="secondary">
                  {t('duty.candidatesCount', { count: selectedIds.length })}
                </Badge>
              )}
            </div>

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
                <div className="space-y-2">
                  {eligibleEmployees.map(employee => {
                    const checked = selectedIds.includes(employee.id);
                    return (
                      <label
                        key={employee.id}
                        htmlFor={`cand-${employee.id}`}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                          checked ? 'bg-primary/5 border-primary/30' : ''
                        }`}
                      >
                        <Checkbox
                          id={`cand-${employee.id}`}
                          checked={checked}
                          onCheckedChange={() => toggle(employee.id)}
                        />
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
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSend} disabled={selectedIds.length === 0 || loading}>
            {loading ? t('common.loading') : t('duty.sendSwapOffer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
