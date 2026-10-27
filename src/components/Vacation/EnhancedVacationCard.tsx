
import React from 'react';
import { format, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, Calendar, User, Check, X, Pencil } from 'lucide-react';
import EmployeeContactActions from '@/components/Shared/EmployeeContactActions';

interface EnhancedVacationCardProps {
  vacation: Vacation;
  onEdit?: (vacation: Vacation) => void;
  onDelete?: (vacation: Vacation) => void;
  onApprove?: (vacation: Vacation) => void;
  onReject?: (vacation: Vacation) => void;
  showActions?: boolean;
}

export const EnhancedVacationCard: React.FC<EnhancedVacationCardProps> = ({
  vacation,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  showActions = true
}) => {
  const { t, currentLanguage } = useTranslation();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      const locale = currentLanguage === 'da' ? da : undefined;
      const weekday = format(date, 'EEEE', { locale });
      const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
      const dateStr = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
      const week = getISOWeek(date);
      const weekLabel = currentLanguage === 'da' ? 'Uge' : 'Week';
      return `${capitalized} ${dateStr} (${weekLabel} ${week})`;
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(`2000-01-01T${timeString}`), 'HH:mm');
    } catch (e) {
      return timeString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success-soft text-success-soft-foreground border-success/20';
      case 'rejected':
        return 'bg-destructive-soft text-destructive border-destructive/20';
      default:
        return 'bg-warning-soft text-warning-soft-foreground border-warning/20';
    }
  };

  const isPartialDay = vacation.request_type === 'partial_day';
  const isSameDay = vacation.start_date === vacation.end_date;

  return (
    <Card className="w-full rounded-lg border-border border-l-2 border-l-info-soft-foreground shadow-none">
      <CardHeader className="pb-3">
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium break-words">
              {isSameDay 
                ? formatDate(vacation.start_date)
                : `${formatDate(vacation.start_date)} - ${formatDate(vacation.end_date)}`
              }
            </span>
          </div>
          <Badge className={getStatusColor(vacation.status)}>
            {t(`vacation.status.${vacation.status}`)}
          </Badge>
        </div>
        
        {vacation.user && (
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{vacation.user.name}</span>
            </span>
            <EmployeeContactActions phone={vacation.user.phone} name={vacation.user.name} size="sm" />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Request Type and Time Information */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {isPartialDay ? (
              <>
                <span className="font-medium">{t('vacation.partialDay')}</span>
                {vacation.start_time && vacation.end_time && (
                  <span className="ml-2 text-muted-foreground">
                    {formatTime(vacation.start_time)} - {formatTime(vacation.end_time)}
                  </span>
                )}
              </>
            ) : (
              <span className="font-medium">{t('vacation.fullDay')}</span>
            )}
          </span>
        </div>

        {/* Reason */}
        {vacation.reason && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">{t('vacation.reason')}: </span>
            <span>{vacation.reason}</span>
          </div>
        )}

        {/* Notes */}
        {vacation.notes && (
          <div className="text-sm">
            <span className="font-medium text-muted-foreground">{t('vacation.notes')}: </span>
            <span>{vacation.notes}</span>
          </div>
        )}

        {/* Status-specific information */}
        {vacation.status === 'approved' && isPartialDay && vacation.start_time && vacation.end_time && (
          <div className="p-2 bg-success-soft rounded-md text-sm text-success-soft-foreground">
            {t('vacation.availableHours', { 
              startTime: formatTime(vacation.start_time), 
              endTime: formatTime(vacation.end_time) 
            })}
          </div>
        )}

        {/* Action buttons */}
        {showActions && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {vacation.status === 'pending' && (
              <>
                {onApprove && (
                  <Button variant="outline"
                    onClick={() => onApprove(vacation)}
                    className="min-h-11 gap-1.5 border-success-soft-foreground/40 bg-success-soft px-3 text-xs font-semibold text-success-soft-foreground hover:bg-success-soft/80"
                  >
                    <Check className="h-4 w-4" aria-hidden />{t('vacation.approve')}
                  </Button>
                )}
                {onReject && (
                  <Button variant="outline"
                    onClick={() => onReject(vacation)}
                    className="min-h-11 gap-1.5 border-destructive-soft-foreground/40 px-3 text-xs font-semibold text-destructive-soft-foreground hover:bg-destructive-soft"
                  >
                    <X className="h-4 w-4" aria-hidden />{t('vacation.reject')}
                  </Button>
                )}
              </>
            )}
            
            {onEdit && vacation.status === 'pending' && (
              <Button variant="outline"
                onClick={() => onEdit(vacation)}
                className="min-h-11 gap-1.5 px-3 text-xs text-foreground hover:bg-accent"
              >
                <Pencil className="h-4 w-4" aria-hidden />{t('common.edit')}
              </Button>
            )}
            
            {onDelete && (
              <Button variant="outline"
                onClick={() => onDelete(vacation)}
                className="min-h-11 px-3 text-xs text-destructive-soft-foreground hover:bg-destructive-soft"
              >
                {t('common.delete')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
