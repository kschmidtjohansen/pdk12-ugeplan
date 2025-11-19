import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyActions } from '@/hooks/duty/useDutyActions';
import { format } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { Trash2, Shield, Car } from 'lucide-react';
import type { Duty } from '@/types/duty';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DutyListProps {
  duties: Duty[];
  onSuccess: () => void;
  canManage: boolean;
}

export const DutyList = ({ duties, onSuccess, canManage }: DutyListProps) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : enUS;
  const { removeDuty, loading } = useDutyActions(onSuccess);

  if (duties.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t('duty.noUpcomingDuties')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {duties.map(duty => (
        <Card key={duty.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Avatar>
                <AvatarImage src={duty.employee?.avatar_url || undefined} />
                <AvatarFallback>
                  {duty.employee?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{duty.employee?.name}</span>
                  <Badge variant={duty.duty_type === 'skadeleder_vagt' ? 'default' : 'secondary'}>
                    <span className="flex items-center gap-1">
                      {duty.duty_type === 'skadeleder_vagt' ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <Car className="h-3 w-3" />
                      )}
                      {duty.duty_type === 'skadeleder_vagt' 
                        ? t('duty.skadelederVagt') 
                        : t('duty.kørevagt')
                      }
                    </span>
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(duty.duty_date), 'EEEE, dd MMMM yyyy', { locale })}
                </div>
                {duty.notes && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {duty.notes}
                  </div>
                )}
              </div>
            </div>

            {canManage && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('duty.confirmRemove')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('duty.confirmRemoveMessage')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('duty.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => removeDuty(duty.id)}
                    >
                      {t('duty.remove')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
