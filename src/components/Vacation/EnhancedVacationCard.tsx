
import React from 'react';
import { format, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, Calendar, User } from 'lucide-react';

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
    <Card className="w-full rounded-xl border-border/60 shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{vacation.user.name}</span>
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
          <div className="flex gap-2 pt-2">
            {vacation.status === 'pending' && (
              <>
                {onApprove && (
                  <button
                    onClick={() => onApprove(vacation)}
                    className="px-3 py-1 text-xs bg-success text-success-foreground rounded hover:bg-success/90"
                  >
                    {t('vacation.approve')}
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={() => onReject(vacation)}
                    className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                  >
                    {t('vacation.reject')}
                  </button>
                )}
              </>
            )}
            
            {onEdit && vacation.status === 'pending' && (
              <button
                onClick={() => onEdit(vacation)}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                {t('common.edit')}
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(vacation)}
                className="px-3 py-1 text-xs bg-muted-foreground text-white rounded hover:bg-muted-foreground/80"
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
