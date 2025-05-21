
import React from 'react';
import { format, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { Check, X, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Vacation } from '../../types/vacation';
import { useTranslation } from '../../context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { formatDateRangeWithWeeks } from '@/utils/dateUtils';

interface VacationCardProps {
  vacation: Vacation;
  canApprove: boolean;
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
  onEdit?: (vacation: Vacation) => void;
  onDelete?: (vacation: Vacation) => void;
}

const VacationCard: React.FC<VacationCardProps> = ({
  vacation,
  canApprove,
  onApprove,
  onReject,
  onEdit,
  onDelete
}) => {
  const { t, currentLanguage } = useTranslation();
  const { user, isAdmin } = useAuth();
  const isOwner = user?.id === vacation.employeeId;
  
  // Determine if the user can edit/delete this vacation
  // Admins can edit/delete any vacation
  // Regular users can only edit/delete their own pending vacations
  const canEditVacation = isAdmin || (isOwner && vacation.status === 'pending');
  const canDeleteVacation = isAdmin || (isOwner && vacation.status === 'pending');

  // Set locale based on current language
  const locale = currentLanguage === 'da' ? da : undefined;
  
  // Add handlers with debug logs
  const handleEdit = () => {
    console.log("Edit button clicked for vacation:", vacation.id);
    if (onEdit && canEditVacation) onEdit(vacation);
  };
  
  const handleDelete = () => {
    console.log("Delete button clicked for vacation:", vacation.id);
    if (onDelete && canDeleteVacation) onDelete(vacation);
  };

  return (
    <Card className={cn("overflow-hidden", 
      vacation.status === 'approved' && "border-green-500", 
      vacation.status === 'rejected' && "border-red-500", 
      vacation.status === 'pending' && "border-amber-500")}>
      <CardHeader className={cn("pb-3", 
        vacation.status === 'approved' && "bg-green-50", 
        vacation.status === 'rejected' && "bg-red-50", 
        vacation.status === 'pending' && "bg-amber-50")}>
        <CardTitle className="flex justify-between items-start">
          <span>{vacation.employeeName}</span>
          <span className={cn("text-xs font-medium px-2 py-1 rounded-full", 
            vacation.status === 'approved' && "bg-green-100 text-green-800", 
            vacation.status === 'rejected' && "bg-red-100 text-red-800", 
            vacation.status === 'pending' && "bg-amber-100 text-amber-800")}>
            {t(`vacation.status.${vacation.status}`)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <dl className="space-y-3 text-sm">
          <div className="flex flex-col">
            <dt className="font-medium text-gray-500">{t("vacation.dateRange")}</dt>
            <dd>
              {formatDateRangeWithWeeks(
                vacation.startDate,
                vacation.endDate,
                currentLanguage,
                t('common.week')
              )}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="font-medium text-gray-500">{t("vacation.reason")}</dt>
            <dd>{vacation.reason}</dd>
          </div>
          {vacation.notes && (
            <div className="flex flex-col">
              <dt className="font-medium text-gray-500">{t("vacation.notes")}</dt>
              <dd>{vacation.notes}</dd>
            </div>
          )}
          <div className="flex flex-col">
            <dt className="font-medium text-gray-500">{t("vacation.requestedOn")}</dt>
            <dd>{format(vacation.createdAt, 'd. MMM yyyy', { locale })}</dd>
          </div>
        </dl>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4 pb-4">
        {/* Edit/delete buttons - shown based on permission checks */}
        {onEdit && onDelete && canEditVacation && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-blue-200 hover:bg-blue-50" 
              onClick={handleEdit}
            >
              <Edit className="mr-1 h-4 w-4" />
              {t("common.edit")}
            </Button>
            {canDeleteVacation && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-200 text-red-600 hover:bg-red-50" 
                onClick={handleDelete}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {t("common.delete")}
              </Button>
            )}
          </div>
        )}
        
        {/* Admin-only approval actions (for pending requests only) */}
        {canApprove && vacation.status === 'pending' && (
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 border-red-200 hover:bg-red-50" 
              onClick={() => onReject(vacation)}
            >
              <X className="mr-1 h-4 w-4" />
              {t("vacation.reject")}
            </Button>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700" 
              onClick={() => onApprove(vacation)}
            >
              <Check className="mr-1 h-4 w-4" />
              {t("vacation.approve")}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default VacationCard;
