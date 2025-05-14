
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Vacation } from '@/types/vacation';
import { Check, Clock, X, CalendarDays, MessageSquareText } from 'lucide-react';
import VacationButtons from './VacationButtons';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface VacationCardProps {
  vacation: Vacation;
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
  onEdit: (vacation: Vacation) => void;
  onDelete: (vacation: Vacation) => void;
}

const VacationCard: React.FC<VacationCardProps> = ({
  vacation,
  onApprove,
  onReject,
  onEdit,
  onDelete
}) => {
  const { t, currentLanguage } = useTranslation();
  const { user, isAdmin, isSkadeleder } = useAuth();
  
  const isOwner = user?.id === vacation.employeeId;
  const canAction = isAdmin || isSkadeleder;
  const isPending = vacation.status === 'pending';
  
  const statusInfoMap = {
    pending: {
      label: t('vacation.status.pending'),
      icon: <Clock className="h-4 w-4 mr-1" />,
      color: 'bg-yellow-100 text-yellow-800'
    },
    approved: {
      label: t('vacation.status.approved'),
      icon: <Check className="h-4 w-4 mr-1" />,
      color: 'bg-green-100 text-green-800'
    },
    rejected: {
      label: t('vacation.status.rejected'),
      icon: <X className="h-4 w-4 mr-1" />,
      color: 'bg-red-100 text-red-800'
    }
  };
  
  const statusInfo = statusInfoMap[vacation.status];
  
  // Format date based on language
  const dateFormat = currentLanguage === 'da' ? 'dd.MM.yyyy' : 'MM/dd/yyyy';
  
  return (
    <Card className={cn(
      "overflow-hidden",
      vacation.status === 'pending' && "border-l-4 border-polygon-yellow",
      vacation.status === 'approved' && "border-l-4 border-polygon-green",
      vacation.status === 'rejected' && "border-l-4 border-red-500"
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{vacation.employeeName}</h3>
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <CalendarDays className="h-4 w-4 mr-1" />
              {format(new Date(vacation.startDate), dateFormat)} - {format(new Date(vacation.endDate), dateFormat)}
            </div>
          </div>
          <Badge className={`${statusInfo.color} flex items-center`}>
            {statusInfo.icon} {statusInfo.label}
          </Badge>
        </div>
        
        {vacation.reason && (
          <div className="mt-3">
            <div className="text-sm font-medium text-gray-700">{t('vacation.reason')}:</div>
            <div className="text-sm text-gray-600">{vacation.reason}</div>
          </div>
        )}
        
        {vacation.notes && (
          <div className="mt-2">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <MessageSquareText className="h-4 w-4 mr-1" />
              {t('vacation.notes')}:
            </div>
            <div className="text-sm text-gray-600 mt-1">{vacation.notes}</div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-3">
          {t('vacation.requestedOn')}: {format(new Date(vacation.createdAt), dateFormat)}
        </div>
      </CardContent>
      
      {(canAction || isOwner) && (
        <CardFooter className="bg-gray-50 px-4 py-2 flex justify-end gap-2">
          <VacationButtons 
            vacation={vacation}
            onApprove={onApprove}
            onReject={onReject}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </CardFooter>
      )}
    </Card>
  );
};

export default VacationCard;
