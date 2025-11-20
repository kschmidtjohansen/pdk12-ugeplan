import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';
import type { Duty } from '@/types/duty';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Car } from 'lucide-react';

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
  const { t } = useTranslation();
  const [selectedDutyId, setSelectedDutyId] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!duty) return null;

  // Filter duties that can be swapped with
  const swappableDuties = allDuties.filter(d => {
    // Exclude the current duty
    if (d.id === duty.id) return false;
    
    // Must have an employee_id (can't swap external duties)
    if (!d.employee_id) return false;
    
    // Must be same duty type
    if (d.duty_type !== duty.duty_type) return false;
    
    return true;
  });

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

            {/* Available Duties to Swap With */}
            <div>
              <h3 className="text-sm font-medium mb-3">{t('duty.selectDutyToSwapWith')}</h3>
              
              {swappableDuties.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t('duty.noAvailableDuties')}</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] border rounded-lg">
                  <RadioGroup value={selectedDutyId} onValueChange={setSelectedDutyId}>
                    <div className="space-y-2 p-4">
                      {swappableDuties.map((d) => {
                        const isPast = new Date(d.duty_date) < new Date();
                        
                        return (
                          <div
                            key={d.id}
                            className={`border rounded-lg p-4 transition-colors ${
                              selectedDutyId === d.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            } ${isPast ? 'opacity-60' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value={d.id} id={d.id} className="mt-1" />
                              <Label htmlFor={d.id} className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-2 mb-2">
                                  {getDutyIcon(d.duty_type)}
                                  <Badge variant="outline" className="font-medium">
                                    {getDutyTypeLabel(d.duty_type)}
                                  </Badge>
                                  {isPast && (
                                    <Badge variant="secondary" className="text-xs">
                                      Tidligere
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium mb-1">
                                  {formatDutyDate(d.duty_date)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {t('duty.assignedTo')}: {d.employee?.name}
                                </p>
                              </Label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </ScrollArea>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              {t('duty.cancel')}
            </Button>
            <Button
              onClick={handleSwapClick}
              disabled={!selectedDutyId || loading}
            >
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
