
import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useVacationSecurity } from '@/hooks/vacation/useVacationSecurity';

interface VacationCardProps {
  vacation: Vacation;
  onApprove?: (vacation: Vacation) => void;
  onReject?: (vacation: Vacation) => void;
  onEdit?: (vacation: Vacation) => void;
  onDelete?: (vacation: Vacation) => void;
}

const VacationCard: React.FC<VacationCardProps> = ({
  vacation,
  onApprove,
  onReject, 
  onEdit,
  onDelete
}) => {
  const { t, currentLanguage } = useTranslation();
  const { user, isEffectiveAdmin, isEffectiveSkadeleder } = useAuth();
  const { canViewVacation, canEditVacation, canDeleteVacation, canManageVacationStatus } = useVacationSecurity();

  // Security check - don't render if user can't view this vacation
  if (!canViewVacation(vacation)) {
    return null;
  }

  const dateFormat = currentLanguage === 'da' ? 'EEEE dd.MM.yyyy' : 'EEEE MM/dd/yyyy';
  const startDate = format(new Date(vacation.start_date), dateFormat);
  const endDate = format(new Date(vacation.end_date), dateFormat);

  const getStatusIcon = () => {
    switch (vacation.status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (vacation.status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const canUserEdit = canEditVacation(vacation);
  const canUserDelete = canDeleteVacation(vacation);
  const canUserManageStatus = canManageVacationStatus();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {vacation.user?.name || 'Unknown Employee'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={getStatusColor() as any}>
              {t(`vacation.status.${vacation.status}`)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Date Information */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {vacation.is_same_day ? (
              startDate
            ) : (
              `${startDate} - ${endDate}`
            )}
          </span>
        </div>

        {/* Request Type and Time Information */}
        {vacation.request_type === 'partial_day' && vacation.start_time && vacation.end_time && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {t('vacation.workingHours')}: {vacation.start_time} - {vacation.end_time}
            </span>
          </div>
        )}

        {/* Reason */}
        {vacation.reason && (
          <div className="text-sm text-muted-foreground">
            <strong>{t('vacation.reason')}:</strong> {vacation.reason}
          </div>
        )}

        {/* Notes for approved/rejected requests */}
        {vacation.notes && vacation.status !== 'pending' && (
          <div className="text-sm text-muted-foreground">
            <strong>{t('vacation.notes')}:</strong> {vacation.notes}
          </div>
        )}

        {/* Request Date */}
        <div className="text-xs text-muted-foreground">
          {t('vacation.requestedOn')}: {format(new Date(vacation.created_at), dateFormat)}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex gap-2 flex-wrap">
          {/* Admin/Skadeleder Actions for Pending Requests */}
          {vacation.status === 'pending' && canUserManageStatus && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => onApprove?.(vacation)}
                className="bg-green-600 hover:bg-green-700"
              >
                {t('vacation.approve')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject?.(vacation)}
              >
                {t('vacation.reject')}
              </Button>
            </>
          )}

          {/* Edit Button - for user's own pending requests or admin/skadeleder */}
          {canUserEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(vacation)}
            >
              {t('vacation.edit')}
            </Button>
          )}

          {/* Delete Button - for user's own pending requests or admin/skadeleder */}
          {canUserDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(vacation)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {t('vacation.delete')}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default VacationCard;
