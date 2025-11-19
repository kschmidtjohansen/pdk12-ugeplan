import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/context/TranslationContext';
import { useDutyActions } from '@/hooks/duty/useDutyActions';
import { format } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { Trash2, Shield, Car, Pencil } from 'lucide-react';
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
  onDutyClick?: (duty: Duty) => void;
}

export const DutyList = ({ duties, onSuccess, canManage, onDutyClick }: DutyListProps) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : enUS;
  const { removeDuty, loading } = useDutyActions(onSuccess);

  // Helper to extract initials from external entry notes
  const getExternalInitials = (notes: string | null | undefined): string => {
    if (!notes?.startsWith('EKSTERN:')) return '?';
    
    // Extract initials from format: "EKSTERN: Name [IN]"
    const match = notes.match(/\[([A-Z]{1,2})\]/);
    if (match) return match[1];
    
    // Fallback: extract from name if no initials in brackets
    const name = notes.split('\n')[0].replace('EKSTERN: ', '');
    return name.split(/\s+/).map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');
  };

  // Helper to get display name from duty
  const getDisplayName = (duty: Duty): string => {
    if (duty.employee?.name) return duty.employee.name;
    if (duty.notes?.startsWith('EKSTERN:')) {
      return duty.notes.split('\n')[0].replace('EKSTERN: ', '').replace(/\s*\[.*?\]\s*/, '').trim();
    }
    return 'Ukendt';
  };

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
                  {duty.employee?.name?.charAt(0) || getExternalInitials(duty.notes)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {getDisplayName(duty)}
                  </span>
                  {duty.notes?.startsWith('EKSTERN:') && (
                    <Badge variant="outline" className="text-xs">Ekstern</Badge>
                  )}
                  <Badge 
                    variant={duty.duty_type === 'skadeleder_vagt' ? 'default' : 'secondary'}
                    className={duty.duty_type === 'kørevagt' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : ''}
                  >
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
                {duty.notes && !duty.notes.startsWith('EKSTERN:') && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {duty.notes}
                  </div>
                )}
                {duty.notes?.startsWith('EKSTERN:') && duty.notes.split('\n')[1] && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {duty.notes.split('\n').slice(1).join('\n')}
                  </div>
                )}
              </div>
            </div>

            {canManage && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDutyClick?.(duty)}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={loading}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {t('duty.remove')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};
