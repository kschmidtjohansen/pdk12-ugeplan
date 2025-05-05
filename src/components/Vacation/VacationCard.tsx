
import React from 'react';
import { format } from 'date-fns';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Vacation } from '../../types/vacation';
import { useTranslation } from '../../context/TranslationContext';

interface VacationCardProps {
  vacation: Vacation;
  canApprove: boolean;
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
}

const VacationCard: React.FC<VacationCardProps> = ({
  vacation,
  canApprove,
  onApprove,
  onReject
}) => {
  const { t } = useTranslation();
  
  return (
    <Card 
      className={cn(
        "overflow-hidden", 
        vacation.status === 'approved' && "border-green-500", 
        vacation.status === 'rejected' && "border-polygon-red", 
        vacation.status === 'pending' && "border-amber-500"
      )}
    >
      <CardHeader 
        className={cn(
          "pb-3", 
          vacation.status === 'approved' && "bg-green-50", 
          vacation.status === 'rejected' && "bg-red-50", 
          vacation.status === 'pending' && "bg-amber-50"
        )}
      >
        <CardTitle className="flex justify-between items-start">
          <span>{vacation.employeeName}</span>
          <span 
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full", 
              vacation.status === 'approved' && "bg-green-100 text-green-800", 
              vacation.status === 'rejected' && "bg-red-100 text-red-800", 
              vacation.status === 'pending' && "bg-amber-100 text-amber-800"
            )}
          >
            {t(`vacation.status.${vacation.status}`)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <dl className="space-y-3 text-sm">
          <div className="flex flex-col">
            <dt className="font-medium text-gray-500">{t("vacation.dateRange")}</dt>
            <dd>
              {format(vacation.startDate, 'PPP')} - {format(vacation.endDate, 'PPP')}
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
            <dd>{format(vacation.createdAt, 'PPP')}</dd>
          </div>
        </dl>
      </CardContent>
      
      {/* Only show approve/reject buttons to admins for pending requests */}
      {canApprove && vacation.status === 'pending' && (
        <CardFooter className="flex justify-between border-t pt-4 pb-4">
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
        </CardFooter>
      )}
    </Card>
  );
};

export default VacationCard;
