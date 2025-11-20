import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Car } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import type { Duty } from '@/types/duty';

interface DutySwapSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duties: Duty[];
  currentUserId?: string;
  onDutySelected: (duty: Duty) => void;
}

export function DutySwapSelectDialog({
  open,
  onOpenChange,
  duties,
  currentUserId,
  onDutySelected,
}: DutySwapSelectDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedDutyId, setSelectedDutyId] = useState<string>('');

  // Filter to only show duties assigned to the current user
  const myDuties = duties.filter(d => {
    // Must be assigned to current user
    if (d.employee_id !== currentUserId || d.employee_id === null) {
      return false;
    }
    
    // Role-based filtering
    if (user?.role === 'servicemedarbejder') {
      // Servicemedarbejder can only swap kørevagt
      return d.duty_type === 'kørevagt';
    }
    
    // Administrator and Skadeleder can swap any duty type
    return true;
  }).sort((a, b) => 
    new Date(a.duty_date).getTime() - new Date(b.duty_date).getTime()
  );

  const selectedDuty = myDuties.find(d => d.id === selectedDutyId);

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

  const handleContinue = () => {
    if (!selectedDuty) return;
    onDutySelected(selectedDuty);
    setSelectedDutyId(''); // Reset for next time
  };

  const handleClose = () => {
    setSelectedDutyId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('duty.swapDuty')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">
              {t('duty.selectDutyToSwapFrom')}
            </h3>
            
            {myDuties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  {user?.role === 'servicemedarbejder' 
                    ? t('duty.noKørevagtAvailable') 
                    : t('duty.noDutiesAvailable')}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] border rounded-lg p-3">
                <RadioGroup 
                  value={selectedDutyId} 
                  onValueChange={setSelectedDutyId}
                >
                  {myDuties.map((duty) => (
                    <div 
                      key={duty.id} 
                      className="flex items-start space-x-2 mb-3 p-3 rounded hover:bg-muted/50 border border-transparent hover:border-border"
                    >
                      <RadioGroupItem value={duty.id} id={`duty-${duty.id}`} />
                      <Label 
                        htmlFor={`duty-${duty.id}`} 
                        className="cursor-pointer flex-1"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getDutyIcon(duty.duty_type)}
                          <Badge variant="outline">
                            {getDutyTypeLabel(duty.duty_type)}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">
                          {formatDutyDate(duty.duty_date)}
                        </p>
                        {duty.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {duty.notes}
                          </p>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!selectedDutyId}
          >
            {t('duty.continueToSelectEmployee')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
