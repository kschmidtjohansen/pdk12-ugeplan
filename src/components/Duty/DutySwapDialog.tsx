import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import type { Duty } from '@/types/duty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Car, Users, Loader2 } from 'lucide-react';

interface DutySwapDialogProps {
  duty: Duty | null;
  allDuties: Duty[];
  currentUserId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwap: (duty1Id: string, duty2Id: string) => Promise<boolean>;
}

export function DutySwapDialog({
  duty,
  allDuties,
  currentUserId,
  open,
  onOpenChange,
  onSwap,
}: DutySwapDialogProps) {
  // Early return FIRST, before any hooks
  if (!duty) return null;
  
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDutyId, setSelectedDutyId] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset duty selection when employee changes
  useEffect(() => {
    setSelectedDutyId('');
  }, [selectedEmployeeId]);

  // Filter duties that can be swapped with
  const swappableDuties = allDuties.filter(d => {
    // Exclude the current duty
    if (d.id === duty.id) return false;
    
    // Must have an employee_id (can't swap external duties)
    if (!d.employee_id) return false;
    
    // Must be same duty type
    if (d.duty_type !== duty.duty_type) return false;
    
    // Role-based filtering
    if (user?.role === 'servicemedarbejder') {
      // Servicemedarbejder can only swap kørevagt
      // This is already handled by the "same duty type" check above,
      // but we add explicit validation for clarity
      if (duty.duty_type !== 'kørevagt') {
        console.warn('Servicemedarbejder attempting to swap non-kørevagt duty');
        return false;
      }
    }
    
    // Administrator and Skadeleder can swap with any compatible duty
    return true;
  });

  // Group duties by employee
  const employeeDuties = useMemo(() => {
    const grouped = swappableDuties.reduce((acc, d) => {
      if (!d.employee?.id) return acc;
      
      if (!acc[d.employee.id]) {
        acc[d.employee.id] = {
          employee: d.employee,
          duties: []
        };
      }
      
      acc[d.employee.id].duties.push(d);
      return acc;
    }, {} as Record<string, { employee: any; duties: Duty[] }>);

    // Sort duties within each employee by date
    Object.values(grouped).forEach(group => {
      group.duties.sort((a, b) => 
        new Date(a.duty_date).getTime() - new Date(b.duty_date).getTime()
      );
    });

    return grouped;
  }, [swappableDuties]);

  // Convert to array and sort alphabetically
  const employeeOptions = useMemo(() => {
    return Object.values(employeeDuties).sort((a, b) => 
      a.employee.name.localeCompare(b.employee.name)
    );
  }, [employeeDuties]);

  const selectedDuty = swappableDuties.find(d => d.id === selectedDutyId);

  const getDutyIcon = (dutyType: string) => {
    return dutyType === 'skadeleder_vagt' ? <Phone className="h-4 w-4" /> : <Car className="h-4 w-4" />;
  };

  const getDutyTypeLabel = (dutyType: string) => {
    return dutyType === 'skadeleder_vagt' ? t('duty.skadelederVagt') : t('duty.kørevagt');
  };

  const formatDutyDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'EEEE d. MMMM yyyy', { locale: da });
  };

  const handleSwapClick = () => {
    if (!selectedDutyId) return;
    setConfirmOpen(true);
  };

  const handleConfirmSwap = async () => {
    if (!selectedDutyId) return;
    
    setLoading(true);
    try {
      await onSwap(duty.id, selectedDutyId);
      setConfirmOpen(false);
      onOpenChange(false);
      setSelectedDutyId('');
    } catch (error) {
      console.error('Error swapping duties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedEmployeeId('');
      setSelectedDutyId('');
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('duty.swapDutyTitle')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Duty */}
            <div>
              <h3 className="text-sm font-medium mb-3">{t('duty.currentDuty')}</h3>
              <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  {getDutyIcon(duty.duty_type)}
                  <Badge variant="outline" className="font-medium">
                    {getDutyTypeLabel(duty.duty_type)}
                  </Badge>
                </div>
                <p className="text-sm font-medium mb-1">
                  {formatDutyDate(duty.duty_date)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('duty.assignedTo')}: {duty.employee?.name}
                </p>
              </div>
            </div>

            {/* Employee Selection */}
            <div>
              <h3 className="text-sm font-medium mb-3">
                {t('duty.selectEmployeeToSwapWith')}
              </h3>
              
              {employeeOptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t('duty.noAvailableDuties')}</p>
                </div>
              ) : (
                <ScrollArea className="h-[200px] border rounded-lg p-3">
                  <RadioGroup value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    {employeeOptions.map(({ employee, duties }) => (
                      <div key={employee.id} className="flex items-center space-x-2 mb-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value={employee.id} id={`emp-${employee.id}`} />
                        <Label 
                          htmlFor={`emp-${employee.id}`} 
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          {employee.avatar_url && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={employee.avatar_url} />
                              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <span className="font-medium">{employee.name}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {duties.length} {duties.length === 1 ? t('duty.duty') : t('duty.duties')}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              )}
            </div>

            {/* Duty Selection - only shown when employee is selected */}
            {selectedEmployeeId && employeeDuties[selectedEmployeeId] && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">
                  {t('duty.selectDutyToSwap')}
                </h3>
                <ScrollArea className="max-h-[250px] border rounded-lg p-3">
                  <RadioGroup value={selectedDutyId} onValueChange={setSelectedDutyId}>
                    {employeeDuties[selectedEmployeeId].duties.map((d) => (
                      <div key={d.id} className="flex items-start space-x-2 mb-3 p-2 rounded hover:bg-muted/50">
                        <RadioGroupItem value={d.id} id={`duty-${d.id}`} />
                        <Label 
                          htmlFor={`duty-${d.id}`} 
                          className="cursor-pointer flex-1"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {getDutyIcon(d.duty_type)}
                            <Badge variant="outline">
                              {getDutyTypeLabel(d.duty_type)}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">
                            {formatDutyDate(d.duty_date)}
                          </p>
                          {d.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {d.notes}
                            </p>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </ScrollArea>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              {t('duty.cancel')}
            </Button>
            <Button
              onClick={handleSwapClick}
              disabled={!selectedEmployeeId || !selectedDutyId || loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('duty.swapDuty')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('duty.confirmSwap')}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDuty && (
                <span>
                  {t('duty.confirmSwap')
                    .replace('{date1}', formatDutyDate(duty.duty_date))
                    .replace('{employee}', selectedDuty.employee?.name || '')
                    .replace('{date2}', formatDutyDate(selectedDuty.duty_date))}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {t('duty.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwap} disabled={loading}>
              {loading ? 'Bytter...' : t('duty.swapDuty')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
